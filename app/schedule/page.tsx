"use client";

import { useEffect, useMemo, useState } from "react";
import QRCode from "react-qr-code";
import {
  Course,
  ScoredSchedule,
  UpdatedCapacities,
  Weights,
  dayToCommon,
  days,
  getCourseByCRN,
  getCourseById,
  getOrderedSchedules,
  minutesBetweenTimes,
  timeToMinutes,
} from "../logic";

function stringToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  const pastelify = (value: number) => {
    // Scale value to between 100 and 228 to ensure pastel colors
    return Math.floor((value % 128) + 100);
  };

  let color = "#";
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xff;
    color += ("00" + pastelify(value).toString(16)).slice(-2);
  }
  return color;
}

function convertTo12HourFormat(hour: number): string {
  // Determine if it's AM or PM
  const period = hour >= 12 ? "pm" : "am";

  // Convert to 12-hour format
  let adjustedHour = hour % 12;
  if (adjustedHour === 0) {
    adjustedHour = 12; // Adjust 0 hour to 12 for 12am and 12pm
  }

  // Return the formatted time string
  return `${adjustedHour}${period}`;
}

export default function Schedule() {
  const [index, setIndex] = useState(0);
  const [weights, setWeights] = useState<Weights>({
    earliestStart: 1,
    latestEnd: 1,
    averageStart: 1,
    averageEnd: 1,
    heavyDay: 1,
  });
  const [schedules, setSchedules] = useState<ScoredSchedule[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [updatedCapacities, setUpdatedCapacities] = useState<UpdatedCapacities>(
    []
  );
  const [registeredCourses, setRegisteredCourses] = useState<
    { title: string; crn: string }[]
  >([]);
  const [newCourse, setNewCourse] = useState("");
  const [gotStoredValues, setGotStoredValues] = useState(false);
  const [forceRegisteredCourses, setForceRegisteredCourses] = useState(true);
  const courses: Course[] = useMemo(() => {
    if (typeof window === "undefined") return [];
    const courseText = localStorage.getItem("courses");
    if (!courseText) {
      return [];
    }
    const parsed: string[] = JSON.parse(courseText);
    return parsed.map((id) => getCourseById(id));
  }, []);

  useEffect(() => {
    const storedWeights = localStorage.getItem("weights");
    if (storedWeights) {
      setWeights(JSON.parse(storedWeights));
    }
    const storedRegisteredCourses = localStorage.getItem("registeredCourses");
    if (storedRegisteredCourses) {
      setRegisteredCourses(
        JSON.parse(storedRegisteredCourses).map((e: string) => ({
          crn: e,
          title: getCourseByCRN(parseInt(e, 10)).title,
        }))
      );
    }
    const storedForceRegisteredCourses = localStorage.getItem(
      "forceRegisteredCourses"
    );
    if (storedForceRegisteredCourses) {
      setForceRegisteredCourses(JSON.parse(storedForceRegisteredCourses));
    }
    setGotStoredValues(true);
  }, []);

  useEffect(() => {
    if (!gotStoredValues) {
      return;
    }
    localStorage.setItem("weights", JSON.stringify(weights));
  }, [weights, gotStoredValues]);

  useEffect(() => {
    if (!gotStoredValues) {
      return;
    }
    localStorage.setItem(
      "registeredCourses",
      JSON.stringify(registeredCourses.map((e) => e.crn))
    );
  }, [registeredCourses, gotStoredValues]);

  useEffect(() => {
    if (!gotStoredValues) {
      return;
    }
    localStorage.setItem(
      "forceRegisteredCourses",
      JSON.stringify(forceRegisteredCourses)
    );
  }, [forceRegisteredCourses, gotStoredValues]);

  useEffect(() => {
    const output = getOrderedSchedules(
      courses,
      weights,
      updatedCapacities,
      registeredCourses.map((e) => e.crn),
      forceRegisteredCourses
    );
    if (index >= output.length) {
      setIndex(0);
    }
    if (output.length === 0) {
      setError("No valid schedules found");
      return;
    }
    setSchedules(output);
  }, [
    index,
    weights,
    updatedCapacities,
    registeredCourses,
    forceRegisteredCourses,
    courses,
  ]);

  const importUrl = `https://racs.lavallee.one/import?data=${btoa(
    JSON.stringify({
      courses: courses.map((e) => e.id),
      registeredCourses: registeredCourses.map((e) => e.crn),
    })
  )}`;

  function updateCapacity() {
    const courseText = localStorage.getItem("courses");
    if (!courseText) {
      return;
    }
    const parsed: string[] = JSON.parse(courseText);
    const courses: Course[] = parsed.map((id) => getCourseById(id));
    if (courses) {
      const crns = courses
        .flatMap((course) => course.sections.map((e) => e.crn))
        .join(",");
      fetch(`/api/capUpdate?crns=${crns}`)
        .then((res) => res.json())
        .then((data: UpdatedCapacities) => {
          localStorage.setItem(
            "updatedCapacities",
            JSON.stringify(
              data.map((member) => ({
                cap: member.cap,
                act: member.act,
                rem: member.rem,
                crn: member.crn,
              }))
            )
          );
          setUpdatedCapacities(data);
        });
    }
  }

  return (
    <div className="w-5/6 m-auto">
      {error && <p className="!text-red-500">{error}</p>}
      {schedules && (
        <>
          <div className="paper">
            <p>Classes: </p>
            <p>
              {schedules[0].schedule
                .map((section) => section.course.title)
                .join(", ")}
            </p>
          </div>
          <div className="justify-between flex w-full paper">
            <button
              className="btn btn-white"
              onClick={() => setIndex(index - 1)}
              disabled={index === 0}
            >
              previous
            </button>
            <p>
              {index + 1} (Found: {schedules.length}) (Score:{" "}
              {schedules[index].score})
            </p>
            <button
              className="btn btn-white"
              onClick={() => setIndex(index + 1)}
              disabled={index === schedules.length - 1}
            >
              next
            </button>
          </div>
        </>
      )}
      <div className="paper pl-12 p-4">
        <div className="h-[512px]">
          <div className="text-right relative">
            {Array.from({ length: 16 }).map((_, i) => (
              <div
                key={i}
                style={{
                  position: "absolute",
                  right: "100%",
                  marginTop: 18 + i * 32,
                }}
              >
                <p>{convertTo12HourFormat(i + 7)}</p>
              </div>
            ))}
          </div>
          {days.map((day) => (
            <div key={day} className="w-1/5 h-full inline-block relative">
              {schedules &&
                schedules[index].schedule.map((section) =>
                  section.timeslots
                    .filter((timeslot) => timeslot.day === day)
                    .map((timeslot) => (
                      <div
                        key={timeslot.day + timeslot.start}
                        className="absolute w-[calc(100%-2px)] text-xs overflow-scroll"
                        style={{
                          backgroundColor: stringToColor(section.course.title),
                          marginTop:
                            32 +
                            timeToMinutes(timeslot.start - 700) / (60 / 32),
                          height:
                            minutesBetweenTimes(timeslot.end, timeslot.start) /
                            (60 / 32),
                        }}
                      >
                        <p> {section.course.title}</p>
                        <p>
                          {section.course.id} - {section.section}
                        </p>
                        <p>{section.crn}</p>
                        <p>{timeslot.instructor}</p>
                        <p>
                          {section.remaining} seats remaining of{" "}
                          {section.capacity}
                        </p>
                      </div>
                    ))
                )}
              <p className="box-border border-b-2 border-t-2 border-r-2 h-8">
                {dayToCommon(day)}
              </p>
              {Array.from({ length: 15 }).map((_, i) => (
                <div
                  key={i}
                  className="h-[6.25%] box-border border-b-2 border-r-2"
                ></div>
              ))}
            </div>
          ))}
        </div>
      </div>
      {schedules && (
        <div className="paper">
          <p className="inline">CRNS (click to copy): </p>
          {schedules[index].schedule
            .sort((a, b) => (a.course.title > b.course.title ? 1 : -1))
            .map((e, index) => (
              <div key={index}>
                <p className="inline">{e.course.title}: </p>
                <p
                  className="inline cursor-pointer hover:underline"
                  onClick={() => {
                    navigator.clipboard.writeText(e.crn.toString());
                  }}
                >
                  {e.crn}
                </p>
              </div>
            ))}
        </div>
      )}
      <div className="paper">
        <p>Registered Courses (Click to remove)</p>
        <ul>
          {registeredCourses.map((course) => (
            <button
              onClick={() => {
                setRegisteredCourses(
                  registeredCourses.filter((e) => e !== course)
                );
              }}
              key={course.crn}
              className="block text-left hover:line-through dark:!decoration-white"
            >
              <p>
                {course.title}: {course.crn}
              </p>
            </button>
          ))}
        </ul>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const course = getCourseByCRN(parseInt(newCourse));
            if (!course) {
              return;
            }
            setRegisteredCourses([
              ...registeredCourses,
              { title: course.title, crn: newCourse },
            ]);
            setNewCourse("");
          }}
        >
          <input
            type="text"
            className="textfield"
            placeholder="CRN"
            value={newCourse}
            onChange={(e) => setNewCourse(e.target.value)}
          />
          <button className="btn btn-white">Add Course</button>
        </form>
      </div>
      <div className="text-sm grid grid-cols-1 lg:grid-cols-5 paper">
        <div className="inline-block">
          <p>Earliest Start Multiplier: {weights.earliestStart}</p>
          <input
            min={0}
            max={10}
            step={0.1}
            type="range"
            value={weights.earliestStart}
            onChange={(e) =>
              setWeights({ ...weights, earliestStart: Number(e.target.value) })
            }
          />
        </div>
        <div className="inline-block">
          <p>Latest End Multiplier: {weights.latestEnd}</p>
          <input
            min={0}
            max={10}
            step={0.1}
            type="range"
            value={weights.latestEnd}
            onChange={(e) =>
              setWeights({ ...weights, latestEnd: Number(e.target.value) })
            }
          />
        </div>
        <div className="inline-block">
          <p>Average Start Mutliplier: {weights.averageStart}</p>
          <input
            min={0}
            max={10}
            step={0.1}
            type="range"
            value={weights.averageStart}
            onChange={(e) =>
              setWeights({ ...weights, averageStart: Number(e.target.value) })
            }
          />
        </div>
        <div className="inline-block">
          <p>Average End Multiplier: {weights.averageEnd}</p>
          <input
            min={0}
            max={10}
            step={0.1}
            type="range"
            value={weights.averageEnd}
            onChange={(e) =>
              setWeights({ ...weights, averageEnd: Number(e.target.value) })
            }
          />
        </div>
        <div className="inline-block">
          <p>Heavy Day Multiplier: {weights.heavyDay}</p>
          <input
            min={0}
            max={10}
            step={0.1}
            type="range"
            value={weights.heavyDay}
            onChange={(e) =>
              setWeights({ ...weights, heavyDay: Number(e.target.value) })
            }
          />
        </div>
        <div className="">
          <p>Force Using Registered Courses</p>
          <input
            type="checkbox"
            checked={forceRegisteredCourses}
            onChange={(e) => setForceRegisteredCourses(e.target.checked)}
          />
        </div>
        <button className="btn btn-white" onClick={updateCapacity}>
          Update Course Capacities
        </button>
        <div className="col-span-2"></div>
        <a
          className=""
          href={`webcal://racs.lavallee.one/api/ical.ics?crns=${registeredCourses
            .map((course) => course.crn)
            .join(",")}`}
        >
          Add To Calendar
        </a>
      </div>
      <div className="paper hidden lg:block">
        <p>Import Schedule On Mobile</p>
        <QRCode value={importUrl} />
        <a className="break-all" href={importUrl}>
          Link
        </a>
      </div>
    </div>
  );
}

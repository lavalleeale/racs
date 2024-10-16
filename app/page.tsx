"use client";
import { useEffect, useState } from "react";
import {
  allSemesters,
  Course,
  courseSearch,
  getCourseByCRN,
  getCourseById,
  getSchedules,
  Semesters,
} from "./logic";

export default function CourseList() {
  const [currentCourses, setCurrentCourses] = useState<Course[]>([]);
  const [registeredCourses, setRegisteredCourses] = useState<
    { title: string; crn: string }[]
  >([]);
  const [gotStoredValues, setGotStoredValues] = useState(false);
  const [query, setquery] = useState("");
  const [courses, setCourses] = useState<ReturnType<typeof courseSearch>>([]);
  useEffect(() => {
    const semester =
      typeof window !== "undefined"
        ? (localStorage.getItem("semester") as Semesters) ?? allSemesters[0]
        : allSemesters[0];
    setCourses(courseSearch(query, semester as Semesters));
  }, [query]);

  useEffect(() => {
    const semester =
      typeof window !== "undefined"
        ? (localStorage.getItem("semester") as Semesters) ?? allSemesters[0]
        : allSemesters[0];

    const storedCourses = localStorage.getItem(`${semester}courses`);
    if (storedCourses) {
      setCurrentCourses(
        JSON.parse(storedCourses).map((storedCourse: string) =>
          getCourseById(storedCourse, semester)
        )
      );
    }
    const storedRegisteredCourses = localStorage.getItem(
      `${semester}registeredCourses`
    );
    if (storedRegisteredCourses) {
      setRegisteredCourses(
        JSON.parse(storedRegisteredCourses).map((e: string) => ({
          crn: e,
          title: getCourseByCRN(parseInt(e, 10), semester as Semesters).title,
        }))
      );
    }
    setGotStoredValues(true);
  }, []);

  useEffect(() => {
    const semester = localStorage.getItem("semester") ?? allSemesters[0];
    if (!gotStoredValues) return;
    localStorage.setItem(
      `${semester}courses`,
      JSON.stringify(currentCourses.map((course) => course.id))
    );
  }, [currentCourses, gotStoredValues]);

  const scheduleCount = getSchedules(
    currentCourses,
    registeredCourses.map((e) => e.crn),
    false
  ).length;
  const valid = scheduleCount > 0;

  return (
    <div className="pt-1">
      <div className="xl:float-right md:mx-12 xl:m-0 m-auto paper">
        <ul>
          <p className={valid ? "" : "!text-red-500"}>
            {scheduleCount} Valid Schedules
          </p>
          {currentCourses.map((course) => {
            return (
              <li key={course.id} className="p-2">
                <p
                  className={`inline-block w-48 ${
                    valid ? "" : "!text-red-500"
                  }`}
                >
                  {course.title}
                </p>
                <button
                  className="btn btn-white"
                  onClick={() =>
                    setCurrentCourses(
                      currentCourses.filter(
                        (currentCourse) => currentCourse !== course
                      )
                    )
                  }
                >
                  Remove Course
                </button>
              </li>
            );
          })}
        </ul>
      </div>
      <div className="md:mx-12 xl:w-2/3 xl:m-0 m-auto">
        <div className="paper">
          <p>Query:</p>
          <input
            className="textfield md:w-1/2"
            placeholder="Search for a course"
            value={query}
            onChange={(e) => setquery(e.target.value)}
          />
        </div>
        <ul>
          {courses.map((course) => (
            <li className="paper" key={course.id}>
              <p className="inline pr-2">
                {course.title} - {course.id}
              </p>
              <button
                className="btn btn-blue"
                onClick={() => setCurrentCourses([...currentCourses, course])}
                disabled={currentCourses.includes(course)}
              >
                Add
              </button>
              <p className="!text-slate-300 text-sm">{course.description}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

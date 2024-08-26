"use client";
import { useEffect, useMemo, useState } from "react";
import { Course, courseSearch, getSchedules } from "./logic";

export default function CourseList() {
  const [currentCourses, setCurrentCourses] = useState<Course[]>([]);
  const [registeredCourses, setRegisteredCourses] = useState<
    { title: string; crn: string }[]
  >([]);
  const [gotStoredValues, setGotStoredValues] = useState(false);
  const [query, setquery] = useState("");
  const courses = useMemo(() => {
    return courseSearch(query);
  }, [query]);

  useEffect(() => {
    const stored = localStorage.getItem("courses");
    if (stored) {
      setCurrentCourses(JSON.parse(stored));
    }
    const storedCourses = localStorage.getItem("registeredCourses");
    if (storedCourses) {
      setRegisteredCourses(JSON.parse(storedCourses));
    }
    setGotStoredValues(true);
  }, []);

  useEffect(() => {
    if (!gotStoredValues) return;
    localStorage.setItem("courses", JSON.stringify(currentCourses));
  }, [currentCourses, gotStoredValues]);

  useEffect(() => {
    if (!gotStoredValues) return;
    localStorage.setItem(
      "registeredCourses",
      JSON.stringify(registeredCourses)
    );
  }, [registeredCourses, gotStoredValues]);

  const scheduleCount = getSchedules(
    currentCourses,
    registeredCourses.map((e) => e.crn),
    false
  ).length;
  const valid = scheduleCount > 0;

  return (
    <div className="pt-1">
      <div className="float-right paper">
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
      <div className="w-2/3">
        <div className="paper">
          <p>Query:</p>
          <input
            className="textfield w-1/2"
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

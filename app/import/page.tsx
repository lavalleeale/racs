"use client";

import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { getCourseById } from "../logic";

export default function Import() {
  const searchParams = useSearchParams();

  const data: { courses: string[]; registeredCourses: string[] } =
    useMemo(() => {
      const data = searchParams.get("data");
      if (!data) {
        return { courses: [], registeredCourses: [] };
      }
      return JSON.parse(atob(data));
    }, [searchParams]);
  return (
    <div className="w-5/6 m-auto">
      <div className="paper">
        <p>Registered courses from import</p>
        <ul>
          {data.courses
            .map((course) => getCourseById(course))
            .map((course) => (
              <p key={course.id}>
                {course.id}: {course.title}
              </p>
            ))}
        </ul>
      </div>
      <div className="paper">
        <p>Registered sections from import</p>
        <ul>
          {data.registeredCourses.map((crn) => (
            <p key={crn}>CRN: {crn}</p>
          ))}
        </ul>
      </div>
      <div className="paper">
        <button
          className="btn btn-white"
          onClick={() => {
            localStorage.setItem("courses", JSON.stringify(data.courses));
            localStorage.setItem(
              "registeredCourses",
              JSON.stringify(data.registeredCourses)
            );
            window.location.href = "/schedule";
          }}
        >
          Import
        </button>
      </div>
    </div>
  );
}

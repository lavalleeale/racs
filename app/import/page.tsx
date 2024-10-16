"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useMemo } from "react";
import { allSemesters, getCourseById, Semesters } from "../logic";

function ImportPage() {
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
            .map((course) =>
              getCourseById(
                course,
                (localStorage.getItem("semester") as Semesters) ??
                  allSemesters[0]
              )
            )
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
            const semester =
              localStorage.getItem("semester") ?? allSemesters[0];
            localStorage.setItem(
              `${semester}courses`,
              JSON.stringify(data.courses)
            );
            localStorage.setItem(
              `${semester}registeredCourses`,
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

export default function Import() {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <ImportPage />;
    </Suspense>
  );
}

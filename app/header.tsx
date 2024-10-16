"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { allSemesters, Semesters, shortSemToLongSem } from "./logic";

const Header = () => {
  const [semester, setSemester] = useState(allSemesters[0]);

  useEffect(() => {
    const retrieved = localStorage.getItem("semester") as Semesters;
    if (retrieved) {
      setSemester(retrieved);
    }
  }, []);

  return (
    <header className="w-full bg-purple-800 p-3 overflow-auto text-white h-12">
      <Link href="/schedule" className="text-white float-right">
        Schedule
      </Link>
      <select
        className="text-white bg-transparent float-right w-min text-right inline"
        onChange={(e) => {
          localStorage.setItem("semester", e.target.value);
          window.location.reload();
        }}
        value={semester}
      >
        {allSemesters.map((semester) => (
          <option key={semester} value={semester}>
            {shortSemToLongSem(semester)}
          </option>
        ))}
      </select>
      <Link href="/" className="text-white">
        RACS
      </Link>
    </header>
  );
};

export default Header;

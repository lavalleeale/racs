import { getCourseByCRN } from "@/app/logic";
import { createEvents } from "ics";
import { NextRequest, NextResponse } from "next/server";

// To handle a GET request to /api
export async function GET(request: NextRequest) {
  process.env.TZ = "America/New_York";
  if (
    !request.nextUrl.searchParams.has("crn") &&
    !request.nextUrl.searchParams.has("crns")
  ) {
    return NextResponse.json({ message: "CRN is required" }, { status: 400 });
  }
  const crns = request.nextUrl.searchParams.get("crns")?.split(",") || [
    request.nextUrl.searchParams.get("crn") ?? "",
  ];
  const events = crns.flatMap((crn) => {
    const course = getCourseByCRN(parseInt(crn, 10));
    if (!course) {
      return [];
    }
    const section = course.sections.find(
      (section) => section.crn.toString() === crn
    );
    if (!section) {
      return [];
    }
    return section.timeslots.map((timeslot) => {
      // sections timeslot has dateStart and dateEnd which are in the format of MM/DD
      // sections timeslot has days array which are the days of the week that the class meets on
      // sections timeslot has timeStart and timeEnd which are in the format of HHMM and numbers
      let startTimeString = timeslot.timeStart.toString();
      if (startTimeString.length === 3) {
        startTimeString = "0" + startTimeString;
      }
      let endTimeString = timeslot.timeEnd.toString();
      if (endTimeString.length === 3) {
        endTimeString = "0" + endTimeString;
      }
      var start = new Date(
        `2024-${timeslot.dateStart.replace("/", "-")}T${startTimeString.slice(
          0,
          -2
        )}:${startTimeString.slice(-2)}:00`
      );
      let startDistance = Math.min(
        ...timeslot.days.map((day) => {
          let distance = convertDayToNum(day) - start.getDay();
          if (distance < 0) {
            distance += 7;
          }
          return distance;
        })
      );
      start.setDate(start.getDate() + startDistance);
      var end = new Date(
        `2024-${timeslot.dateStart.replace("/", "-")}T${endTimeString.slice(
          0,
          -2
        )}:${endTimeString.slice(-2)}:00`
      );
      let endDistance = Math.min(
        ...timeslot.days.map((day) => {
          let distance = convertDayToNum(day) - end.getDay();
          if (distance < 0) {
            distance += 7;
          }
          return distance;
        })
      );
      var endDate = new Date(
        `2024-${timeslot.dateEnd.replace("/", "-")}T${endTimeString.slice(
          0,
          -2
        )}:${endTimeString.slice(-2)}:00`
      );
      end.setDate(end.getDate() + endDistance);
      return {
        start: start.getTime(),
        end: end.getTime(),
        title: `${course.id} - ${course.title}`,
        description: course.title,
        location: timeslot.location,
        recurrenceRule:
          "FREQ=WEEKLY;BYDAY=" +
          timeslot.days.map((day) => convertDayToIcal(day)).join(",") +
          ";UNTIL=" +
          endDate.toISOString().split("T")[0].replace(/-/g, "") +
          "T" +
          endDate.toISOString().split("T")[1].replace(/:/g, "").split(".")[0],
      };
    });
  });
  const { value, error } = createEvents(events);
  if (error) {
    return NextResponse.json({ message: error }, { status: 500 });
  }
  return new NextResponse(value);
}

function convertDayToIcal(day: string) {
  switch (day) {
    case "M":
      return "MO";
    case "T":
      return "TU";
    case "W":
      return "WE";
    case "R":
      return "TH";
    case "F":
      return "FR";
    case "S":
      return "SA";
    case "U":
      return "SU";
    default:
      return "";
  }
}

function convertDayToNum(day: string) {
  switch (day) {
    case "M":
      return 1;
    case "T":
      return 2;
    case "W":
      return 3;
    case "R":
      return 4;
    case "F":
      return 5;
    case "S":
      return 6;
    case "U":
      return 7;
    default:
      return 0;
  }
}

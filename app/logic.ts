import catalog from "./catalog_sis.json";
import groups from "./courses.json";

export type Course = (typeof groups)[0]["courses"][0];
export type Section = Course["sections"][0];
export type Schedule = Section[];
export type FormattedSchedule = {
  course: Course;
  crn: number;
  section: string;
  capacity: number;
  remaining: number;
  timeslots: { day: string; start: number; end: number; instructor: string }[];
}[];
export type Weights = {
  earliestStart: number;
  latestEnd: number;
  averageStart: number;
  averageEnd: number;
  heavyDay: number;
};
export type ScoredSchedule = { schedule: FormattedSchedule; score: number };
export type UpdatedCapacities = {
  cap: number;
  act: number;
  rem: number;
  crn: number;
}[];

export const days = ["M", "T", "W", "R", "F"];

export function dayToCommon(day: string) {
  switch (day) {
    case "M":
      return "Monday";
    case "T":
      return "Tuesday";
    case "W":
      return "Wednesday";
    case "R":
      return "Thursday";
    case "F":
      return "Friday";
    default:
      return "Unknown";
  }
}

function hasConflict(section1: Section, section2: Section) {
  for (let i = 0; i < section1.timeslots.length; i++) {
    const existingTimeslot = section1.timeslots[i];
    for (let j = 0; j < section2.timeslots.length; j++) {
      const newTimeslot = section2.timeslots[j];
      if (existingTimeslot.days.some((day) => newTimeslot.days.includes(day))) {
        if (
          !(
            newTimeslot.timeEnd < existingTimeslot.timeStart ||
            newTimeslot.timeStart > existingTimeslot.timeEnd
          )
        ) {
          return true;
        }
      }
    }
  }
  return false;
}

export function getSchedules(
  courses: Course[],
  updateCapacities: UpdatedCapacities = []
) {
  if (courses.length === 0) {
    return [];
  }
  var schedules: Schedule[] = courses[0].sections.map((e) => [e]);
  courses.slice(1).forEach((course) => {
    var newSchedules: Schedule[] = [];
    course.sections.forEach((newSection) => {
      if (updateCapacities.length > 0) {
        const updated = updateCapacities.find(
          (update) => update.crn === newSection.crn
        );
        if (updated) {
          newSection.cap = updated.cap;
          newSection.act = updated.act;
          newSection.rem = updated.rem;
        }
      }
      if (newSection.rem !== 0) {
        outer: for (let i = 0; i < schedules.length; i++) {
          const schedule = schedules[i];
          for (let j = 0; j < schedule.length; j++) {
            const existingSection = schedule[j];
            if (hasConflict(existingSection, newSection)) {
              continue outer;
            }
          }
          newSchedules.push(schedule.concat(newSection));
        }
      }
    });
    schedules = newSchedules;
  });
  return schedules;
}

function score(schedule: FormattedSchedule, weights: Weights) {
  let score = 0;
  let earliestStart = Math.min(
    ...schedule.flatMap((section) =>
      section.timeslots.map((timeslot) =>
        minutesBetweenTimes(700, timeslot.start)
      )
    )
  );
  score += earliestStart * weights.earliestStart;
  let latestEnd = Math.min(
    ...schedule.flatMap((section) =>
      section.timeslots.map((timeslot) =>
        minutesBetweenTimes(2200, timeslot.end)
      )
    )
  );
  score += latestEnd * weights.latestEnd;
  let averageStart =
    days
      .map((day) =>
        Math.min(
          ...schedule.flatMap((section) =>
            section.timeslots
              .filter((timeslot) => timeslot.day === day)
              .map((timeslot) => minutesBetweenTimes(700, timeslot.start))
          )
        )
      )
      .reduce((acc, start) => acc + start, 0) / days.length;
  score += averageStart * weights.averageStart;
  let averageEnd =
    days
      .map((day) =>
        Math.min(
          ...schedule.flatMap((section) =>
            section.timeslots
              .filter((timeslot) => timeslot.day === day)
              .map((timeslot) => minutesBetweenTimes(2200, timeslot.end))
          )
        )
      )
      .reduce((acc, end) => acc + end, 0) / days.length;
  score += averageEnd * weights.averageEnd;
  let heavyDay = Math.max(
    ...days.map(
      (day) =>
        schedule.flatMap((section) =>
          section.timeslots.filter((timeslot) => timeslot.day === day)
        ).length
    )
  );
  score -= heavyDay * 100 * weights.heavyDay;
  return score;
}

function getCourse(crn: number) {
  for (let i = 0; i < groups.length; i++) {
    for (let j = 0; j < groups[i].courses.length; j++) {
      for (let k = 0; k < groups[i].courses[j].sections.length; k++) {
        if (groups[i].courses[j].sections[k].crn === crn) {
          return groups[i].courses[j];
        }
      }
    }
  }
}

function formatSchedule(schedule: Schedule): FormattedSchedule {
  return schedule.map((section) => ({
    course: getCourse(section.crn)!,
    crn: section.crn,
    section: section.sec,
    capacity: section.cap,
    remaining: section.rem,
    timeslots: section.timeslots.flatMap((timeslot) =>
      timeslot.days.map((day) => ({
        day: day,
        start: timeslot.timeStart,
        end: timeslot.timeEnd,
        instructor: timeslot.instructor,
      }))
    ),
  }));
}

function scoreSchedules(
  schedules: Schedule[],
  weights: Weights
): ScoredSchedule[] {
  return schedules.map((schedule) => {
    const formatted = formatSchedule(schedule);
    return {
      schedule: formatted,
      score: score(formatted, weights),
    };
  });
}

export function getOrderedSchedules(
  courses: Course[],
  weights: Weights,
  updateCapacities: UpdatedCapacities = []
) {
  var updatedCourses: Course[] = JSON.parse(JSON.stringify(courses));
  if (updateCapacities.length > 0) {
    console.log(updateCapacities);
    for (let i = 0; i < updatedCourses.length; i++) {
      for (let j = 0; j < updatedCourses[i].sections.length; j++) {
        const updated = updateCapacities.find(
          (update) => update.crn === updatedCourses[i].sections[j].crn
        );
        if (updated) {
          updatedCourses[i].sections[j].cap = updated.cap;
          updatedCourses[i].sections[j].act = updated.act;
          updatedCourses[i].sections[j].rem = updated.rem;
        }
      }
    }
  }
  const schedules = getSchedules(courses, updateCapacities);
  const scored_schedules = scoreSchedules(schedules, weights);
  return scored_schedules.sort((a, b) => b.score - a.score);
}

export function timeToMinutes(time: number): number {
  const hours = Math.floor(time / 100);
  const minutes = time % 100;
  return hours * 60 + minutes;
}

export function minutesBetweenTimes(time1: number, time2: number): number {
  const minutes1 = timeToMinutes(time1);
  const minutes2 = timeToMinutes(time2);
  return Math.abs(minutes2 - minutes1);
}

export function courseSearch(query: string) {
  const lowerQuery = query.toLowerCase();
  const courses = groups.flatMap((group) => group.courses);
  const response = courses
    .filter(
      (course) =>
        course.title.toLowerCase().includes(lowerQuery) ||
        course.id.toLowerCase().includes(lowerQuery) ||
        catalog[course.id as keyof typeof catalog].description
          .toLowerCase()
          .includes(lowerQuery)
    )
    .map((course) => ({
      ...course,
      description: catalog[course.id as keyof typeof catalog].description,
    }));
  return response;
}

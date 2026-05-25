import { EmploiDuTempsResponse } from "@/types/emploiDuTemps";

export interface TimeSlot {
  label: string;
  start: string; // "HH:MM"
  end: string;   // "HH:MM"
}

export const DAYS_OF_WEEK = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

export const DEFAULT_TIME_SLOTS: TimeSlot[] = [
  { label: "8h30 à 10h00", start: "08:30", end: "10:00" },
  { label: "10h10 à 11h40", start: "10:10", end: "11:40" },
  { label: "11h50 à 13h20", start: "11:50", end: "13:20" },
  { label: "Pause déjeuner", start: "13:20", end: "14:30" },
  { label: "14h30 à 16h00", start: "14:30", end: "16:00" },
  { label: "16h10 à 17h40", start: "16:10", end: "17:40" },
];

export function getDayName(jourSemaine: number): string {
  return DAYS_OF_WEEK[jourSemaine] || "Inconnu";
}

export function matchCourseToSlots(course: EmploiDuTempsResponse, slots: TimeSlot[]): number[] {
  const formatTime = (timeStr: string) => {
    if (!timeStr) return "";
    const parts = timeStr.split(":");
    if (parts.length >= 2) {
      return `${parts[0].padStart(2, "0")}:${parts[1].padStart(2, "0")}`;
    }
    return timeStr;
  };

  const courseStart = formatTime(course.heure_debut);
  const courseEnd = formatTime(course.heure_fin);

  const matchedIndices: number[] = [];

  slots.forEach((slot, index) => {
    const slotStart = formatTime(slot.start);
    const slotEnd = formatTime(slot.end);

    if (courseStart === slotStart && courseEnd === slotEnd) {
      matchedIndices.push(index);
    } else if (courseStart < slotEnd && courseEnd > slotStart) {
      matchedIndices.push(index);
    }
  });

  return matchedIndices;
}

export interface CourseDisplayData {
  course: EmploiDuTempsResponse;
  startSlot: number;
  span: number;
}

export function buildTimetableGrid(
  courses: EmploiDuTempsResponse[],
  timeSlots: TimeSlot[] = DEFAULT_TIME_SLOTS
) {
  const grid: Record<number, Record<number, { render: boolean; rowSpan: number; courses: EmploiDuTempsResponse[] }>> = {};

  for (let s = 0; s < timeSlots.length; s++) {
    grid[s] = {};
    for (let d = 0; d < 7; d++) {
      grid[s][d] = { render: true, rowSpan: 1, courses: [] };
    }
  }

  const courseData: CourseDisplayData[] = courses.map(course => {
    const indices = matchCourseToSlots(course, timeSlots);
    return {
      course,
      startSlot: indices.length > 0 ? Math.min(...indices) : -1,
      span: indices.length
    };
  }).filter(c => c.startSlot !== -1);

  for (let d = 0; d < 7; d++) {
    const dayCourses = courseData.filter(c => c.course.jour_semaine === d);
    
    let s = 0;
    while (s < timeSlots.length) {
      const startingCourses = dayCourses.filter(c => c.startSlot === s);
      
      if (startingCourses.length > 0) {
        const maxSpan = Math.max(...startingCourses.map(c => c.span));
        
        grid[s][d].render = true;
        grid[s][d].rowSpan = maxSpan;
        grid[s][d].courses = startingCourses.map(c => c.course);
        
        for (let k = 1; k < maxSpan; k++) {
          if (s + k < timeSlots.length) {
            grid[s + k][d].render = false;
            const swallowedCourses = dayCourses.filter(c => c.startSlot === s + k);
            grid[s][d].courses.push(...swallowedCourses.map(c => c.course));
          }
        }
        
        s += maxSpan;
      } else {
        grid[s][d].render = true;
        grid[s][d].rowSpan = 1;
        s++;
      }
    }
  }

  return grid;
}

export interface SchoolGradeGroup {
  gradeName: string;
  totalClasses: number;
  classes: {
    code: string;
    track: string;
    fullLabel: string;
  }[];
}

export const SCHOOL_CLASSES_BY_GRADE: SchoolGradeGroup[] = [
  {
    gradeName: 'Prvi razred',
    totalClasses: 10,
    classes: [
      { code: 'I-1', track: 'Društveno-jezički smer', fullLabel: 'I-1 — Društveno-jezički smer' },
      { code: 'I-2', track: 'Društveno-jezički smer', fullLabel: 'I-2 — Društveno-jezički smer' },
      { code: 'I-3', track: 'Društveno-jezički smer', fullLabel: 'I-3 — Društveno-jezički smer' },
      { code: 'I-4', track: 'Društveno-jezički smer', fullLabel: 'I-4 — Društveno-jezički smer' },
      { code: 'I-5', track: 'Prirodno-matematički smer', fullLabel: 'I-5 — Prirodno-matematički smer' },
      { code: 'I-6', track: 'Prirodno-matematički smer', fullLabel: 'I-6 — Prirodno-matematički smer' },
      { code: 'I-7', track: 'Prirodno-matematički smer', fullLabel: 'I-7 — Prirodno-matematički smer' },
      { code: 'I-8', track: 'Prirodno-matematički smer', fullLabel: 'I-8 — Prirodno-matematički smer' },
      { code: 'I-9', track: 'Prirodno-matematički smer', fullLabel: 'I-9 — Prirodno-matematički smer' },
      { code: 'I-10', track: 'Računarstvo i informatika (IT smer)', fullLabel: 'I-10 — Smer za računarstvo i informatiku (IT)' },
    ],
  },
  {
    gradeName: 'Drugi razred',
    totalClasses: 10,
    classes: [
      { code: 'II-1', track: 'Društveno-jezički smer', fullLabel: 'II-1 — Društveno-jezički smer' },
      { code: 'II-2', track: 'Društveno-jezički smer', fullLabel: 'II-2 — Društveno-jezički smer' },
      { code: 'II-3', track: 'Društveno-jezički smer', fullLabel: 'II-3 — Društveno-jezički smer' },
      { code: 'II-4', track: 'Društveno-jezički smer', fullLabel: 'II-4 — Društveno-jezički smer' },
      { code: 'II-5', track: 'Prirodno-matematički smer', fullLabel: 'II-5 — Prirodno-matematički smer' },
      { code: 'II-6', track: 'Prirodno-matematički smer', fullLabel: 'II-6 — Prirodno-matematički smer' },
      { code: 'II-7', track: 'Prirodno-matematički smer', fullLabel: 'II-7 — Prirodno-matematički smer' },
      { code: 'II-8', track: 'Prirodno-matematički smer', fullLabel: 'II-8 — Prirodno-matematički smer' },
      { code: 'II-9', track: 'Prirodno-matematički smer', fullLabel: 'II-9 — Prirodno-matematički smer' },
      { code: 'II-10', track: 'Računarstvo i informatika (IT smer)', fullLabel: 'II-10 — Smer za računarstvo i informatiku (IT)' },
    ],
  },
  {
    gradeName: 'Treći razred',
    totalClasses: 11,
    classes: [
      { code: 'III-1', track: 'Društveno-jezički smer', fullLabel: 'III-1 — Društveno-jezički smer' },
      { code: 'III-2', track: 'Društveno-jezički smer', fullLabel: 'III-2 — Društveno-jezički smer' },
      { code: 'III-3', track: 'Društveno-jezički smer', fullLabel: 'III-3 — Društveno-jezički smer' },
      { code: 'III-4', track: 'Društveno-jezički smer', fullLabel: 'III-4 — Društveno-jezički smer' },
      { code: 'III-5', track: 'Prirodno-matematički smer', fullLabel: 'III-5 — Prirodno-matematički smer' },
      { code: 'III-6', track: 'Prirodno-matematički smer', fullLabel: 'III-6 — Prirodno-matematički smer' },
      { code: 'III-7', track: 'Prirodno-matematički smer', fullLabel: 'III-7 — Prirodno-matematički smer' },
      { code: 'III-8', track: 'Prirodno-matematički smer', fullLabel: 'III-8 — Prirodno-matematički smer' },
      { code: 'III-9', track: 'Prirodno-matematički smer', fullLabel: 'III-9 — Prirodno-matematički smer' },
      { code: 'III-10', track: 'Prirodno-matematički smer', fullLabel: 'III-10 — Prirodno-matematički smer' },
      { code: 'III-11', track: 'Računarstvo i informatika (IT smer)', fullLabel: 'III-11 — Smer za računarstvo i informatiku (IT)' },
    ],
  },
  {
    gradeName: 'Četvrti razred',
    totalClasses: 10,
    classes: [
      { code: 'IV-1', track: 'Društveno-jezički smer', fullLabel: 'IV-1 — Društveno-jezički smer' },
      { code: 'IV-2', track: 'Društveno-jezički smer', fullLabel: 'IV-2 — Društveno-jezički smer' },
      { code: 'IV-3', track: 'Društveno-jezički smer', fullLabel: 'IV-3 — Društveno-jezički smer' },
      { code: 'IV-4', track: 'Društveno-jezički smer', fullLabel: 'IV-4 — Društveno-jezički smer' },
      { code: 'IV-5', track: 'Prirodno-matematički smer', fullLabel: 'IV-5 — Prirodno-matematički smer' },
      { code: 'IV-6', track: 'Prirodno-matematički smer', fullLabel: 'IV-6 — Prirodno-matematički smer' },
      { code: 'IV-7', track: 'Prirodno-matematički smer', fullLabel: 'IV-7 — Prirodno-matematički smer' },
      { code: 'IV-8', track: 'Prirodno-matematički smer', fullLabel: 'IV-8 — Prirodno-matematički smer' },
      { code: 'IV-9', track: 'Prirodno-matematički smer', fullLabel: 'IV-9 — Prirodno-matematički smer' },
      { code: 'IV-10', track: 'Računarstvo i informatika (IT smer)', fullLabel: 'IV-10 — Smer za računarstvo i informatiku (IT)' },
    ],
  },
];

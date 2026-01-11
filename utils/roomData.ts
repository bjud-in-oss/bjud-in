
// Koordinater i pixlar baserat på en 1200x800 "canvas"
export const MAP_WIDTH = 1200;
export const MAP_HEIGHT = 800;

export const MAP_POINTS = [
  { id: '01', name: 'Stora salen', x: 864, y: 360 },       // 72%, 45%
  { id: '02', name: 'Kulturhallen', x: 600, y: 360 },      // 50%, 45%
  { id: '03', name: 'Kulturhallen Bakre', x: 336, y: 360 }, // 28%, 45%
  { id: '06', name: 'FamilySearch', x: 936, y: 680 },      // 78%, 85%
  { id: '07', name: 'Mötesrum', x: 816, y: 680 },          // 68%, 85%
  { id: '12', name: 'Doprummet', x: 456, y: 640 },         // 38%, 80%
  { id: '20', name: 'Högrådsrummet', x: 60, y: 320 },      // 5%, 40%
  { id: '21', name: 'Presidentens kontor', x: 60, y: 640 },// 5%, 80%
  { id: '24', name: 'Mötesrum', x: 84, y: 96 },            // 7%, 12%
];

export const LOCAL_NAME = 'Personligt läge';

export interface ListOption {
    type: 'local' | 'room';
    name: string;
    id?: string;
    x?: number;
    y?: number;
}

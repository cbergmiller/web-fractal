export interface Coordinates {
    centerRe: number;
    centerIm: number;
    dRe: number;
}

export interface CoordsHistoryItem {
    coords: Coordinates;
    date: Date;
}
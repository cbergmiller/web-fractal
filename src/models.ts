export interface Coordinates {
    centerRe: number;
    centerIm: number;
    dRe: number;
}

export interface CoordsHistoryItem {
    coords: Coordinates;
    date: Date;
}

export interface SelectOption {
    name: string;
    value: string | number;
}

export interface ColorOptions {
    scheme: string;
    cycles: number;
    reversed: boolean;
    distLimit: number;
}

export enum FractalType {
    Mandelbrot,
    MandelbrotDEM,
    Julia,
    JuliaDEM,
}
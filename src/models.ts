export interface Coordinates {
    centerRe: number;
    centerIm: number;
    dRe: number;
}

export interface CoordsHistoryItem {
    coords: Coordinates;
    date: Date;
    type: FractalType;
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

const baseTypes = {
    [FractalType.Mandelbrot]: FractalType.Mandelbrot,
    [FractalType.MandelbrotDEM]: FractalType.Mandelbrot,
    [FractalType.Julia]: FractalType.Julia,
    [FractalType.JuliaDEM]: FractalType.JuliaDEM,
}

export function getBaseType(type: FractalType): FractalType {
    return baseTypes[type];
}

export const aspectRatioClassNames = {
    '4:3': 'a4-3',
    '16:10': 'a16-10',
    '16:9': 'a16-9',
}
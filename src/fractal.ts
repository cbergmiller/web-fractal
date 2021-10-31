import {color} from 'd3-color';
import {scaleSequential} from 'd3-scale';
import * as scales from 'd3-scale-chromatic';
import WebWorker from 'web-worker:./worker.ts';
import {Coordinates, SelectOption, FractalType, ColorOptions} from './models';

// See: https://github.com/d3/d3-scale-chromatic
export const colorSchemes = {
    turbo: scales.interpolateTurbo,
    viridis: scales.interpolateViridis,
    inferno: scales.interpolateInferno,
    magma: scales.interpolateMagma,
    plasma: scales.interpolatePlasma,
    cividis: scales.interpolateCividis,
    cubehelix: scales.interpolateCubehelixDefault,
    grey: scales.interpolateGreys,
};

export const fractalTypeOptions: SelectOption[] = [
    {
        name: 'Mandelbrot',
        value: FractalType.Mandelbrot,
    },
    {
        name: 'Mandelbrot Distance Estimation',
        value: FractalType.MandelbrotDEM,
    },
    {
        name: 'Julia',
        value: FractalType.Julia,
    },
    {
        name: 'Julia Distance Estimation',
        value: FractalType.JuliaDEM,
    },
];

interface FractalOptions {
    type: FractalType;
    coords: Coordinates;
    juliaCoords: Coordinates;
    xPixels: number;
    yPixels: number;
    maxIter: number;
    colorOptions: ColorOptions;
    workerCount: number;
    plotLines: (yStart: number, data: number[]) => void;
}

const workers: Worker[] = [];

function initWorkers(count: number, handleResult: (e: MessageEvent) => void) {
    // Create workers
    const n = count - workers.length;
    if (n) {
        for (let i = 0; i < n; i++) {
            workers.push(new WebWorker());
        }
    }
    // Update result callback function
    for (let i = 0; i < count; i++) {
        workers[i].onmessage = handleResult;
    }
}

function initIterativeColor(colorOptions: ColorOptions, maxIter: number) {
    const maxColorIter = Math.ceil(maxIter / colorOptions.cycles);
    const scale = scaleSequential(colorSchemes[colorOptions.scheme]).domain(
        colorOptions.reversed ? [maxColorIter, 0] : [0, maxColorIter]
    );
    // Calc color map
    const colorMap = [];
    for (let i = 0; i < maxColorIter; i++) {
        colorMap.push(color(scale(i)));
    }
    colorMap.push(color('rgba(0, 0, 0, 255)'));
    // ToDo: measure impact of use of function call for every pixel
    return function (n: number) {
        return colorMap[n === maxIter ? maxColorIter : n % maxColorIter];
    };
}

/**
 *
 */
function initDistanceColor(colorOptions: ColorOptions) {
    const scale = scaleSequential(colorSchemes[colorOptions.scheme])
        .domain(colorOptions.reversed ? [colorOptions.distLimit, 0] : [0, colorOptions.distLimit])
        .clamp(true);
    return function (n) {
        if (!n) return color('rgba(0, 0, 0, 255)');
        return color(scale(n));
    };
}

export function drawFractal(options: FractalOptions): Promise<boolean> {
    const {coords, xPixels, yPixels, maxIter, colorOptions, workerCount, plotLines, juliaCoords} = options;
    const dIm = (coords.dRe * yPixels) / xPixels;
    const reMin = coords.centerRe - coords.dRe / 2;
    const reMax = coords.centerRe + coords.dRe / 2;
    const imMin = coords.centerIm - dIm / 2;
    const imMax = coords.centerIm + dIm / 2;

    return new Promise(resolve => {
        // ToDo: move coloring into worker
        const colorFn =
            options.type === FractalType.Mandelbrot || options.type === FractalType.Julia
                ? initIterativeColor(colorOptions, maxIter)
                : initDistanceColor(colorOptions);
        const linesPerBatch = 20;
        let nResults = Math.ceil(yPixels / linesPerBatch);
        console.time();
        initWorkers(workerCount, function (e) {
            // Plot the rows
            const {y, arr} = e.data;
            for (let i = 0; i < arr.length; i++) {
                arr[i] = colorFn(arr[i]);
            }
            plotLines(y, arr);
            nResults -= 1;
            if (!nResults) {
                console.timeEnd();
                resolve(true);
            }
        });

        for (let y = 0; y < yPixels; y += linesPerBatch) {
            workers[(y / linesPerBatch) % workerCount].postMessage({
                type: options.type,
                y,
                xPixels,
                yPixels,
                reMin,
                reMax,
                imMin,
                imMax,
                juliaRe: juliaCoords.centerRe,
                juliaIm: juliaCoords.centerIm,
                maxIter,
                count: linesPerBatch,
            });
        }
    });
}

/**
 * Transform pixels to complex coordinates
 */
export function pixelToComplex(x, y, xPixels, yPixels, coords: Coordinates) {
    const dIm = (coords.dRe * yPixels) / xPixels;
    const reMin = coords.centerRe - coords.dRe / 2;
    const reMax = coords.centerRe + coords.dRe / 2;
    const imMin = coords.centerIm - dIm / 2;
    const imMax = coords.centerIm + dIm / 2;
    const real = reMin + ((reMax - reMin) * x) / xPixels;
    const imag = imMin + ((imMax - imMin) * y) / yPixels;
    return [real, imag];
}

interface FractalOrbitOptions {
    type: FractalType;
    coords: Coordinates;
    xPixels: number;
    yPixels: number;
    maxIter: number;
    plotDots: (data: number[]) => void;
}

export function drawOrbit(options: FractalOrbitOptions) {
    const {coords, xPixels, yPixels, maxIter, plotDots} = options;
    initWorkers(1, function (e) {
        plotDots(e.data);
    });
    workers[0].postMessage({
        isOrbital: true,
        xPixels,
        yPixels,
        coords,
        maxIter,
    });
}

/*
Points of interest

-0.7393578357781522
-0.2421984546433715i
7.313879275202695e-9
Magnification: 420693298.8943446

Center Real: 0.3360434967259972
Center Imag.: -0.04860233603110305
Diameter Real: 2.285023468797168e-9

0.001643721971153
0.822467633298876i

0.001643721972148683
0.8224676332989973
2.164940800000001e-11

-0.2429584385991947
0.724807885291176i
0.00006551467440149465

-0.7350795821900084
-0.16959117143016852
0.000003446127999999975

-0.7726490442538153
-0.12520022256064256
0.0006380259839999961

-1.747348601567935
-0.0014944961940103077
1.5040283146776475e-8

-1.4098452847968386
-0.1295803092471446
1.7031488632999768e-12

 */

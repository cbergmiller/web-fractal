import {color} from 'd3-color';
import {scaleSequential} from 'd3-scale';
import * as scales from 'd3-scale-chromatic';
import WebWorker from 'web-worker:./worker.ts';

// See: https://github.com/d3/d3-scale-chromatic
export const colorSchemes = {
    turbo: scales.interpolateTurbo,
    viridis: scales.interpolateViridis,
    inferno: scales.interpolateInferno,
    magma: scales.interpolateMagma,
    plasma: scales.interpolatePlasma,
    cividis: scales.interpolateCividis,
    cubehelix: scales.interpolateCubehelixDefault,
};

export interface Coodinates {
    centerRe: number;
    centerIm: number;
    dRe: number;
}

export interface ColorOptions {
    scheme: string;
    cycles: number;
    reversed: boolean;
}

interface FractalOptions {
    coords: Coodinates;
    xPixels: number;
    yPixels: number;
    maxIter: number;
    colorOptions: ColorOptions;
    workerCount: number;
    plotLines: (yStart: number, data: number[]) => void;
}

export function drawFractal(options: FractalOptions): Promise<boolean> {
    const {coords, xPixels, yPixels, maxIter, colorOptions, workerCount, plotLines} = options;
    const dIm = (coords.dRe * yPixels) / xPixels;
    const reMin = coords.centerRe - coords.dRe / 2;
    const reMax = coords.centerRe + coords.dRe / 2;
    const imMin = coords.centerIm - dIm / 2;
    const imMax = coords.centerIm + dIm / 2;

    const maxColorIter = Math.ceil(maxIter / colorOptions.cycles);
    return new Promise(resolve => {
        const scale = scaleSequential(colorSchemes[colorOptions.scheme]).domain(
            colorOptions.reversed ? [maxColorIter, 0] : [0, maxColorIter]
        );
        // Calc color map
        const colorMap = [];
        for (let i = 0; i < maxColorIter; i++) {
            colorMap.push(color(scale(i)));
        }
        colorMap.push(color('rgba(0, 0, 0, 255)'));

        const linesPerBatch = 10;
        let nResults = Math.ceil(yPixels / linesPerBatch);

        function handleResult(e) {
            // Plot one row
            const {y, rows} = e.data;
            const data = [];
            for (let i = 0; i < rows.length; i++) {
                for (let x = 0; x < rows[i].length; x++) {
                    const n = rows[i][x];
                    const color = n === maxIter ? colorMap[maxColorIter] : colorMap[n % maxColorIter];
                    data.push(color);
                }
            }
            plotLines(y, data);
            nResults -= 1;
            if (!nResults) {
                resolve(true);
            }
        }

        const workers = [];
        for (let i = 0; i < workerCount; i++) {
            const worker = new WebWorker();
            worker.onmessage = handleResult;
            workers.push(worker);
        }

        for (let y = 0; y < yPixels; y += linesPerBatch) {
            workers[(y / linesPerBatch) % workerCount].postMessage({
                y,
                xPixels,
                yPixels,
                reMin,
                reMax,
                imMin,
                imMax,
                maxIter,
            });
        }
    });
}

/**
 * Transform pixels to complex coordinates
 */
export function pixelToComplex(x, y, xPixels, yPixels, coords: Coodinates) {
    const dIm = (coords.dRe * yPixels) / xPixels;
    const reMin = coords.centerRe - coords.dRe / 2;
    const reMax = coords.centerRe + coords.dRe / 2;
    const imMin = coords.centerIm - dIm / 2;
    const imMax = coords.centerIm + dIm / 2;
    const real = reMin + ((reMax - reMin) * x) / xPixels;
    const imag = imMin + ((imMax - imMin) * y) / yPixels;
    return [real, imag];
}

// document.getElementById('canvas')

/*
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
 */

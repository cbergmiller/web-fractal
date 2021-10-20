import {color} from 'd3-color';
import {scaleSequential} from 'd3-scale';
import {interpolateCividis} from 'd3-scale-chromatic';
import WebWorker from 'web-worker:./worker.ts';

interface Coodinates {
    centerRe: number;
    centerIm: number
    dRe: number;
}

interface FractalOptions {
    coords: Coodinates;
    xPixels: number;
    yPixels: number;
    maxIter: number;
    colorWrap: number;
    workerCount: number;
    plotLines: (yStart: number, data: number[]) => void;
}

export function drawFractal(options: FractalOptions): Promise<boolean> {
    const {coords, xPixels, yPixels, maxIter, colorWrap, workerCount, plotLines} = options;
    const dIm = (coords.dRe * yPixels) / xPixels;
    const reMin = coords.centerRe - coords.dRe / 2;
    const reMax = coords.centerRe + coords.dRe / 2;
    const imMin = coords.centerIm - dIm / 2;
    const imMax = coords.centerIm + dIm / 2;
    console.log(coords, reMin, reMax, imMin, imMax)
    const maxColorIter = Math.ceil(maxIter / colorWrap);
    return new Promise(resolve => {
        // https://github.com/d3/d3-scale-chromatic
        // interpolateCividis  interpolateCubehelixDefault
        const scale = scaleSequential(interpolateCividis).domain([0, maxColorIter]);
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
Center Real: -0.7393578357781522
Center Imag.: -0.2421984546433715
Diameter Real: 7.313879275202695e-9
Magnification: 420693298.8943446

Center Real: 0.3360434967259972
Center Imag.: -0.04860233603110305
Diameter Real: 2.285023468797168e-9

Real 0.001643721971153
Imag 0.822467633298876i
 */

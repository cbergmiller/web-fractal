import {color} from 'd3-color';
import {scaleSequential} from 'd3-scale';
import {interpolateCividis} from 'd3-scale-chromatic';
import WebWorker from 'web-worker:./worker.ts';

export function drawFractal(centerRe: number, centerIm: number, dRe: number, maxAbs2: number, xPixels: number,
                            yPixels: number, maxIter: number, colorWrap: number, plotLines): Promise<boolean> {
    const dIm = dRe * yPixels / xPixels;
    const reMin = centerRe - dRe / 2;
    const reMax = centerRe + dRe / 2;
    const imMin = centerIm - dIm / 2;
    const imMax = centerIm + dIm / 2;
    const maxColorIter = Math.ceil(maxIter / colorWrap);
    return new Promise((resolve) => {
        // https://github.com/d3/d3-scale-chromatic
        // interpolateCividis  interpolateCubehelixDefault
        const scale = scaleSequential(interpolateCividis).domain([0, maxColorIter]);
        // Calc color map
        const colorMap = [];
        for (let i = 0; i < maxColorIter; i++) {
            colorMap.push(color(scale(i)));
        }
        colorMap.push(color('rgba(0, 0, 0, 255)'))
        const linesPerBatch = 10;
        let nResults = Math.ceil(yPixels / linesPerBatch)

        function handleResult(e) {
            // Plot one row
            const {y, rows} = e.data;
            const data = []
            for (let i = 0; i < rows.length; i++) {
                for (let x = 0; x < rows[i].length; x++) {
                    const n = rows[i][x];
                    const color = n === maxIter ? colorMap[maxColorIter] : colorMap[n % maxColorIter]
                    data.push(color);
                }
            }
            plotLines(y, data);
            nResults -= 1;
            if (!nResults) {
                resolve(true);
            }
        }

        const n = 4;
        const workers = []
        for (let i = 0; i < n; i++) {
            const worker = new WebWorker();
            worker.onmessage = handleResult;
            workers.push(worker)
        }

        for (let y = 0; y < yPixels; y += linesPerBatch) {
            workers[(y / linesPerBatch) % n].postMessage({
                y,
                xPixels,
                yPixels,
                reMin,
                reMax,
                imMin,
                imMax,
                maxAbs2,
                maxIter
            });
        }
    });
}

/**
 * Transform pixels to complex coordinates
 */
export function pixelToComplex(x, y, xPixels, yPixels, centerRe, centerIm, dRe) {
    const dIm = dRe * yPixels / xPixels;
    const reMin = centerRe - dRe / 2;
    const reMax = centerRe + dRe / 2;
    const imMin = centerIm - dIm / 2;
    const imMax = centerIm + dIm / 2;
    const real = reMin + (reMax - reMin) * x / xPixels;
    const imag = imMin + (imMax - imMin) * y / yPixels;
    return [real, imag]
}

// document.getElementById('canvas')

/*
Center Real: -0.7393578357781522
Center Imag.: -0.2421984546433715
Diameter Real: 7.313879275202695e-9
Magnification: 420693298.8943446
 */
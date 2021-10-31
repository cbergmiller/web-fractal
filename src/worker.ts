import {FractalType} from './models';

/**
 * Escape time algorithm for z(n+1) := z(n)² + c (Julia-Set)
 * @param x
 * @param y
 * @param xAdd
 * @param yAdd
 * @param maxIter
 * @param orbitArr
 */
function julia(x: number, y: number, xAdd: number, yAdd: number, maxIter: number, orbitArr?: number[]): number {
    const isOrbital = !!orbitArr;
    let remainIter = maxIter;
    let xx = x * x;
    let yy = y * y;
    let xy = x * y;
    let value2 = xx + yy;
    let xOld = 0;
    let yOld = 0;
    let period = 0;

    while (value2 <= 4 && remainIter > 0) {
        remainIter--;
        x = xx - yy + xAdd;
        y = xy + xy + yAdd;
        xx = x * x;
        yy = y * y;
        xy = x * y;
        value2 = xx + yy;
        if (xOld === x && yOld === y) {
            // We are inside the Mandelbrot set, leave the while loop
            return maxIter;
        }
        period += 1;
        if (period > 20) {
            period = 0;
            xOld = x;
            yOld = y;
        }
        if (isOrbital) {
            orbitArr.push(x, y);
        }
    }
    return maxIter - remainIter;
}

// See: http://www.fractalforums.com/mandelbrot-and-julia-set/problem-with-mandelbrot-distance-estimator/
function mandelDistance(cx: number, cy: number, maxIter: number, dRe: number) {
    let remainIter = maxIter;
    let x = 0;
    let y = 0;
    let xx = 0;
    let yy = 0;
    let xy = 0;
    let value2 = 0;
    let dx = 1;
    let dy = 0;

    while (value2 <= 128 && remainIter > 0) {
        remainIter--;
        // Calc derivative
        const dx2 = 2 * (dx * x - dy * y) + 1;
        dy = 2 * (dx * y + dy * x);
        dx = dx2;
        //
        x = xx - yy + cx;
        y = xy + xy + cy;
        xx = x * x;
        yy = y * y;
        xy = x * y;
        value2 = xx + yy;
    }
    if (!remainIter) {
        return 0;
    }
    // Calc distance
    const absZ = Math.sqrt(value2);
    // Abs(z) * log(z²) / Abs(dz)
    const dist = (absZ * Math.log(absZ + 1e-100)) / Math.sqrt(dx * dx + dy * dy);
    return dist / dRe;
}

self.addEventListener('message', function (e) {
    if (e.data.isOrbital) {
        const {xPixels, yPixels, coords, maxIter} = e.data;
        const arr = [];
        julia(coords.centerRe, coords.centerIm, coords.centerRe, coords.centerIm, maxIter, arr);
        // Convert orbit points to pixel plane
        for (let i = 0; i < arr.length; i += 2) {
            arr[i] = xPixels * (arr[i] + 2.5) * 0.25;
            arr[i + 1] = yPixels * (arr[i + 1] + 1.25) * 0.4;
        }
        postMessage(arr);
    } else {
        const {y, xPixels, yPixels, reMin, reMax, imMin, imMax, maxIter, count, juliaRe, juliaIm} = e.data;
        const dRe = reMax - reMin;
        const xScale = dRe / xPixels;
        const yScale =  (imMax - imMin) / yPixels;
        const yEnd = Math.min(y + count, yPixels)
        const arr = [];
        if (e.data.type === FractalType.Mandelbrot) {
            for (let y2 = y; y2 < yEnd; y2++) {
                const cIm = imMin + yScale * y2;
                for (let x = 0; x < xPixels; x++) {
                    const cRe = reMin + xScale * x;
                    arr.push(julia(cRe, cIm, cRe, cIm, maxIter));
                }
            }
        } else if (e.data.type === FractalType.MandelbrotDEM) {
            for (let y2 = y; y2 < yEnd; y2++) {
                const cIm = imMin + yScale * y2;
                for (let x = 0; x < xPixels; x++) {
                    const cRe = reMin + xScale * x;
                    arr.push(mandelDistance(cRe, cIm, maxIter, dRe));
                }
            }
        } else if (e.data.type === FractalType.Julia) {
            for (let y2 = y; y2 < yEnd; y2++) {
                const cIm = imMin + yScale * y2;
                for (let x = 0; x < xPixels; x++) {
                    const cRe = reMin + xScale * x;
                    arr.push(julia(cRe, cIm, juliaRe, juliaIm, maxIter));
                }
            }
        } else {
            for (let y2 = y; y2 < yEnd; y2++) {
                const cIm = imMin + yScale * y2;
                for (let x = 0; x < xPixels; x++) {
                    const cRe = reMin + xScale * x;
                    arr.push(mandelDistance(cRe, cIm, maxIter, dRe));
                }
            }
        }
        postMessage({y, arr});
    }
});

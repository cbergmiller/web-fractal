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
        remainIter = remainIter - 1;
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

self.addEventListener('message', function (e) {
    if (e.data.isOrbital) {
        const {xPixels, yPixels, coords, maxIter} = e.data;
        const arr = [];
        julia(coords.centerRe, coords.centerIm, coords.centerRe, coords.centerIm, maxIter, arr);
        // Convert orbit points to pixel plane
        for (let i = 0; i < arr.length; i += 2) {
            arr[i] = xPixels * (arr[i] + 2.5) * .25;
            arr[i + 1] = yPixels * (arr[i + 1] + 1.25) * .4;
        }
        postMessage(arr);
    } else {
        const {y, xPixels, yPixels, reMin, reMax, imMin, imMax, maxIter, count, juliaCoords} = e.data;
        const rows = [];
        for (let y2 = y; y2 < Math.min(y + count, yPixels); y2++) {
            const line = [];
            const cIm = imMin + ((imMax - imMin) * y2) / yPixels;
            for (let x = 0; x < xPixels; x++) {
                const cRe = reMin + ((reMax - reMin) * x) / xPixels;
                const iterations = julia(cRe, cIm, juliaCoords?.centerRe ?? cRe, juliaCoords?.centerIm ?? cIm, maxIter);
                line.push(iterations);
            }
            rows.push(line);
        }
        postMessage({y, rows});
    }
});

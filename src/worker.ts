function julia(x: number, y: number, maxIter: number): number {
    const xAdd = x;
    const yAdd = y;
    let remainIter = maxIter;
    let xx = x * x;
    let yy = y * y;
    let xy = x * y;
    let value2 = xx + yy;

    while ((value2 <= 4) && (remainIter > 0)) {
        remainIter = remainIter - 1;
        x = xx - yy + xAdd;
        y = xy + xy + yAdd;
        xx = x * x;
        yy = y * y;
        xy = x * y;
        value2 = xx + yy;
    }
    return maxIter - remainIter;
}

self.addEventListener('message', function (e) {
    const {y, xPixels, yPixels, reMin, reMax, imMin, imMax, maxIter} = e.data;
    const rows = [];
    for (let y2 = y; y2 < Math.min(y + 10, yPixels); y2++) {
        const line = [];
        const cIm = imMin + ((imMax - imMin) * y2) / yPixels;
        for (let x = 0; x < xPixels; x++) {
            const cRe = reMin + ((reMax - reMin) * x) / xPixels;
            const iterations = julia(cRe, cIm, maxIter);
            line.push(iterations);
        }
        rows.push(line);
    }
    postMessage({y, rows});
});
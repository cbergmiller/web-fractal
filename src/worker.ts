function julia(x, y, xAdd, yAdd, maxValue2, maxIter) {
    let remainIter = maxIter;
    let xx = x * x;
    let yy = y * y;
    let xy = x * y;
    let value2 = xx + yy;

    while ((value2 <= maxValue2) && (remainIter > 0)) {
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
    const {y, xPixels, yPixels, reMin, reMax, imMin, imMax, maxAbs2, maxIter} = e.data;
    const rows = [];
    for (let y2 = y; y2 < Math.min(y + 10, yPixels); y2++) {
        const line = []
        const cIm = imMin + (imMax - imMin) * y2 / yPixels
        for (let x = 0; x < xPixels; x++) {
            const cRe = reMin + (reMax - reMin) * x / xPixels;
            const iterations = julia(cRe, cIm, cRe, cIm, maxAbs2, maxIter);
            line.push(iterations);
        }
        rows.push(line);
    }
    postMessage({y, rows});
});

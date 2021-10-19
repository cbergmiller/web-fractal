<script lang="ts">
    import {onMount} from 'svelte';
    import {drawFractal, pixelToComplex} from './fractal';

    let w = 1;
    let h = 1;
    let ctx: CanvasRenderingContext2D;
    let canvas: HTMLCanvasElement;
    let canvasW;
    let canvasH;
    // Init plane
    let centerRe = -.7;
    let centerIm = 0;
    let dRe = 3.0769;
    let maxIter = 150;
    let maxAbs2 = 8;
    let colorWrap = 4;
    let isBusy = false;
    // Init zoom box
    let showZoom = false;
    let zoomCenterX;
    let zoomCenterY;
    let zoom;
    $: zoomW = w * zoom;
    $: zoomH = h * zoom;

    function plotLines(yStart, data) {
        const sh = data.length / w;
        const image = ctx.getImageData(0, yStart, w, sh);
        for (let i = 0; i < data.length; i++) {
            const pos = i * 4;
            image.data[pos] = data[i].r;
            image.data[pos + 1] = data[i].g;
            image.data[pos + 2] = data[i].b;
            image.data[pos + 3] = 255;
        }
        ctx.putImageData(image, 0, yStart);
    }

    function renderFractal() {
        console.log('renderFractal', drawFractal, isBusy)
        isBusy = true;
        drawFractal(centerRe, centerIm, dRe, maxAbs2, w, h, maxIter, colorWrap, plotLines).then(() => {
            isBusy = false;
        });
    }

    onMount(() => {
        const dpr = window.devicePixelRatio || 1;
        console.log(dpr, canvas.width, canvas.height, canvasW, canvasH)
        canvas.width = canvasW * dpr;
        canvas.height = canvasH * dpr;
        w = canvasW * dpr;
        h = canvasH * dpr;
        ctx = canvas.getContext('2d');
        console.log('w', w, 'h', h);
        ctx.clearRect(0, 0, w, h);
        renderFractal();
    })

    // ToDo: allow input of coords as text
    // ToDo: show zoom level
    // ToDo: preview zoom coordinates
    // ToDo: Block gui while fractal renders

    function initZoom() {
        if (!showZoom) {
            showZoom = true;
            zoomCenterX = w / 2;
            zoomCenterY = h / 2;
            zoom = 1;
        }
    }

    window.onkeydown = function (e) {
        // console.log(e.key)
        switch (e.key) {
            case 'ArrowUp':
                initZoom();
                zoomCenterY -= 10;
                e.preventDefault();
                break;
            case 'ArrowDown':
                initZoom();
                zoomCenterY += 10;
                e.preventDefault();
                break;
            case 'ArrowLeft':
                initZoom();
                zoomCenterX -= 10;
                break;
            case 'ArrowRight':
                initZoom();
                zoomCenterX += 10;
                break;
            case '-':
                initZoom();
                zoom -= 0.02;
                break;
            case '+':
                initZoom();
                zoom += 0.02;
                break;
            case ' ':
            case 'Enter':
                if (isBusy) return;
                centerRe = pixelToComplex(zoomCenterX, zoomCenterY, w, h, centerRe, centerIm, dRe)[0];
                centerIm = pixelToComplex(zoomCenterX, zoomCenterY, w, h, centerRe, centerIm, dRe)[1];
                dRe *= zoom;
                showZoom = false;
                renderFractal();
                break;
        }
    }
</script>

<main>
    <div class="layout">
        <div id="fractal">
            <canvas bind:this={canvas} bind:clientWidth={canvasW} bind:clientHeight={canvasH}></canvas>
            <svg viewBox="0 0 {w} {h}" xmlns="http://www.w3.org/2000/svg" id="overlay">
                {#if showZoom}
                    <rect x={zoomCenterX - zoomW / 2} y={zoomCenterY - zoomH / 2} width={zoomW} height={zoomH}
                          fill="none" stroke="grey" stroke-width="2px" id="zoom-box"/>
                {/if}
            </svg>
        </div>
        <div id="info">
            Center Real: {centerRe}<br/>
            Center Imag.: {centerIm}<br/>
            Diameter Real: {dRe}<br/>
            Magnification: {3.0769 / dRe}<br/>
            <br/>
            <label>
                Max. Iterations:
                <input type=number bind:value={maxIter} min=30 max=999999>
            </label>
            <br/>
            <label>
                Bailout:
                <input type=number bind:value={maxAbs2} min=4 max=999999>
            </label>
            <br/>
            <label>
                Color Wrap:
                <input type=number bind:value={colorWrap} min=1 max=100>
            </label>
            <br/>
            <button on:click={renderFractal} disabled={isBusy}>{isBusy ? 'Working..' : 'Redraw'}</button>
        </div>
    </div>
</main>

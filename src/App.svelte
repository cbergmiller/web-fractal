<script lang="ts">
    import {onMount} from 'svelte';
    import NumberInput from './Number-input.svelte';
    import {drawFractal, pixelToComplex} from './fractal';

    let w = 1;
    let h = 1;
    let ctx: CanvasRenderingContext2D;
    let canvas: HTMLCanvasElement;
    let canvasW;
    let canvasH;
    // Init plane
    let coords = {
        centerRe: -0.7,
        centerIm: 0,
        dRe: 3.0769,
    };
    let maxIter = 150;
    let colorWrap = 4;
    let isBusy = false;
    let workerCount = 4;
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
        isBusy = true;
        drawFractal({
            coords,
            xPixels: w,
            yPixels: h,
            maxIter,
            colorWrap,
            workerCount,
            plotLines,
        }).then(() => {
            isBusy = false;
        }).catch(e => {
            console.error(e);
            isBusy = false;
        });
    }

    onMount(() => {
        const dpr = window.devicePixelRatio || 1;
        console.log(dpr, canvas.width, canvas.height, canvasW, canvasH);
        canvas.width = canvasW * dpr;
        canvas.height = canvasH * dpr;
        w = canvasW * dpr;
        h = canvasH * dpr;
        ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, w, h);
        renderFractal();
    });

    // ToDo: allow input of coords
    // ToDo: color options (palette)
    // ToDo: canvas size options
    // ToDo: save image as file
    // ToDo: history of coordinates/settings

    function initZoom() {
        if (!showZoom) {
            showZoom = true;
            zoomCenterX = w / 2;
            zoomCenterY = h / 2;
            zoom = 1;
        }
    }

    function handleKeyDown(e) {
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
                coords = {
                    centerRe: pixelToComplex(zoomCenterX, zoomCenterY, w, h, coords)[0],
                    centerIm: pixelToComplex(zoomCenterX, zoomCenterY, w, h, coords)[1],
                    dRe: coords.dRe * zoom,
                }
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
                    <rect
                        x={zoomCenterX - zoomW / 2}
                        y={zoomCenterY - zoomH / 2}
                        width={zoomW}
                        height={zoomH}
                        fill="none"
                        stroke="grey"
                        stroke-width="2px"
                        id="zoom-box"
                    />
                {/if}
            </svg>
        </div>
        <div id="info">
            Center Real: {coords.centerRe}<br />
            Center Imag.: {coords.centerIm}<br />
            Diameter Real: {coords.dRe}<br />
            <br />
            Magnification: {3.0769 / coords.dRe}<br />
            <br />
            Width: {w}<br />
            Height: {h}<br />
            <br />{maxIter}
            <NumberInput label="Max. Iterations:" bind:value={maxIter} min="30" max="999999" />
            <br />
            <NumberInput label="Web Workers:" bind:value={workerCount} min="1" max="8" />
            <br />
            <NumberInput label="Color Wrap:" bind:value={colorWrap} min="1" max="100" />
            <br />
            <button on:click={renderFractal} disabled={isBusy}>{isBusy ? 'Working..' : 'Redraw'}</button>
        </div>
    </div>
</main>

<svelte:window on:keydown={handleKeyDown} />

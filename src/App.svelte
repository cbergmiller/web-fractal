<script lang="ts">
    import {onMount} from 'svelte';
    import NumberInput from './Number-input.svelte';
    import CoordInput from './Coord-input.svelte';
    import ColorSchemeInput from './Color-scheme-input.svelte';
    import {ColorOptions, Coodinates, drawFractal, pixelToComplex} from './fractal';

    let w = 1;
    let h = 1;
    let ctx: CanvasRenderingContext2D;
    let canvas: HTMLCanvasElement;
    let canvasW;
    let canvasH;
    // Init plane
    let coords: Coodinates = {
        centerRe: -0.7,
        centerIm: 0,
        dRe: 3.0769,
    };
    let coordsHistory = [];
    let maxIter = 150;
    let colorOptions: ColorOptions = {
        scheme: 'turbo',
        cycles: 4,
        reversed: false,
    };
    let isBusy = false;
    let workerCount = 4;
    let zoomBox = null;
    $: zoomCoords = zoomBox ? pixelToComplex(zoomBox.centerX, zoomBox.centerY, w, h, coords) : null;

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
            colorOptions,
            workerCount,
            plotLines,
        })
            .then(() => {
                isBusy = false;
            })
            .catch(e => {
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

    // ToDo: canvas size options (aspect ratio with native resolution, 1920*1080, ...)
    // ToDo: save/load settings
    // ToDo: history of coordinates/settings
    // ToDo: align all values with grid
    // ToDo: orbital mode (follow pointer an draw orbit)
    // ToDo: Distance estimation method
    // ToDo: Julia

    function initZoom() {
        if (!zoomBox) {
            zoomBox = {
                centerX: w / 2,
                centerY: h / 2,
                zoom: 0.5,
            };
        }
    }

    function handleKeyDown(e) {
        // console.log(e.key)
        if (e.key === 'z') {
            if (!zoomBox) {
                initZoom();
            } else {
                zoomBox = null;
            }
        }
        if (zoomBox) {
            switch (e.key) {
                case 'ArrowUp':
                    zoomBox = {...zoomBox, centerY: zoomBox.centerY - 10};
                    e.preventDefault();
                    break;
                case 'ArrowDown':
                    zoomBox = {...zoomBox, centerY: zoomBox.centerY + 10};
                    e.preventDefault();
                    break;
                case 'ArrowLeft':
                    zoomBox = {...zoomBox, centerX: zoomBox.centerX - 10};
                    break;
                case 'ArrowRight':
                    zoomBox = {...zoomBox, centerX: zoomBox.centerX + 10};
                    break;
                case '-':
                    zoomBox = {...zoomBox, zoom: zoomBox.zoom - 0.02};
                    break;
                case '+':
                    zoomBox = {...zoomBox, zoom: zoomBox.zoom + 0.02};
                    break;
                case ' ':
                case 'Enter':
                    if (isBusy) return;
                    coords = {
                        centerRe: zoomCoords[0],
                        centerIm: zoomCoords[1],
                        dRe: coords.dRe * zoomBox.zoom,
                    };
                    renderFractal();
                    break;
                case 'Escape':
                    zoomBox = null;
                    break;
            }
        }
    }
</script>

<main>
    <div class="layout">
        <div id="fractal">
            <canvas bind:this={canvas} bind:clientWidth={canvasW} bind:clientHeight={canvasH} />
            {#if zoomBox}
                <svg viewBox="0 0 {w} {h}" xmlns="http://www.w3.org/2000/svg" id="overlay">
                    <rect
                        x={zoomBox.centerX - (w * zoomBox.zoom) / 2}
                        y={zoomBox.centerY - (h * zoomBox.zoom) / 2}
                        width={w * zoomBox.zoom}
                        height={h * zoomBox.zoom}
                        fill="none"
                        stroke="grey"
                        stroke-width="2px"
                        id="zoom-box"
                    />
                </svg>
            {/if}
        </div>
        <div id="info">
            <CoordInput bind:value={coords} />
            <br />
            Magnification: {3.0769 / coords.dRe}<br />
            <br />
            Width: {w}<br />
            Height: {h}<br />
            <br />
            <NumberInput label="Max. Iterations:" bind:value={maxIter} min="30" max="999999" />
            <br />
            <NumberInput label="Web Workers:" bind:value={workerCount} min="1" max="8" />
            <br />
            <ColorSchemeInput bind:value={colorOptions.scheme} />
            <br />
            <NumberInput label="Color Cycles:" bind:value={colorOptions.cycles} min="1" max="100" />
            <br />
            <div
                class="cursor-default"
                on:click={() => {
                    colorOptions = {...colorOptions, reversed: !colorOptions.reversed};
                }}
            >
                Reversed Colors: {colorOptions.reversed ? 'yes' : 'no'}
            </div>
            <button on:click={renderFractal} disabled={isBusy}>{isBusy ? 'Working..' : 'Redraw'}</button>
            <br />
            {#if zoomBox}
                <br />
                Zoom: {zoomBox.zoom}<br />
                Center Real: {zoomCoords[0]}<br />
                Center Imag: {zoomCoords[1]}i<br />
                Diameter Real: {coords.dRe * zoomBox.zoom}<br />
                <p>Press SPACE or ENTER to redraw with zoom. Press "z" or "ESC" to end zoom mode.</p>
            {:else}
                <p>Press "z" to activate zoom mode.</p>
            {/if}
        </div>
    </div>
</main>

<svelte:window on:keydown={handleKeyDown} />

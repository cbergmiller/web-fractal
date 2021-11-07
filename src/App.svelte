<script lang="ts">
    import classNames from 'classnames';
    import NumberInput from './Number-input.svelte';
    import CoordInput from './Coords-input.svelte';
    import Select from './Select.svelte';
    import CoordsHistory from './Coords-history.svelte';
    import {
        ColorOptions,
        Coordinates,
        CoordsHistoryItem,
        FractalType,
        getBaseType,
        aspectRatioClassNames,
    } from './models';
    import {colorSchemes, drawFractal, drawOrbit, fractalTypeOptions, pixelToComplex} from './fractal';
    import {tail} from './utils';

    const dpr = window.devicePixelRatio || 1;
    let w = 1;
    let h = 1;
    let ctx: CanvasRenderingContext2D;
    let orbitalCtx: CanvasRenderingContext2D;
    let canvas: HTMLCanvasElement;
    let orbitalCanvas: HTMLCanvasElement;
    let canvasW;
    let canvasH;
    let isOrbitalCanvasInitialized = false;
    let type = FractalType.Mandelbrot;
    let size = '16:10';
    // Init plane
    let coords: Coordinates = {
        centerRe: -0.7,
        centerIm: 0,
        dRe: 3.0769,
    };
    let juliaCoords: Coordinates = {
        centerRe: -0.122561,
        centerIm: 0.744862,
        dRe: 0,
    };
    let coordsHistory: CoordsHistoryItem[] = [];
    let maxIter = 150;
    let colorOptions: ColorOptions = {
        scheme: 'cividis',
        cycles: 4,
        reversed: false,
        distLimit: 0.002,
    };
    let isBusy = false;
    let workerCount = 4;
    let zoomBox = null;
    $: zoomCoords = zoomBox ? pixelToComplex(zoomBox.centerX, zoomBox.centerY, w, h, coords) : null;
    let isOrbital = false;

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

    function filterCoordsHistory(t: FractalType) {
        return coordsHistory.filter(item => getBaseType(item.type) === getBaseType(t));
    }

    function renderFractal() {
        // Update the coordinates history if the coordinates have changed
        const filtered = filterCoordsHistory(type);
        const lastItem = tail(filtered);
        if (
            !lastItem ||
            lastItem.coords.centerRe !== coords.centerRe ||
            lastItem.coords.centerIm !== coords.centerIm ||
            lastItem.coords.dRe !== coords.dRe
        ) {
            coordsHistory = [...coordsHistory, {coords, date: new Date(), type: type}];
        }
        isBusy = true;
        drawFractal({
            type,
            coords,
            juliaCoords,
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

    function initCanvas() {
        if (isBusy) return;
        if (ctx) {
            ctx.clearRect(0, 0, w, h);
        }
        // Initialize canvas on mount and when it is resized
        canvas.width = canvasW * dpr;
        canvas.height = canvasH * dpr;
        w = Math.floor(canvasW * dpr);
        h = Math.floor(canvasH * dpr);
        console.log(dpr, canvas.width, canvas.height, canvasW, canvasH);
        if (!ctx) {
            ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, w, h);
        }
        renderFractal();
    }

    $: {
        if (canvas && canvasW && canvasH) {
            initCanvas();
        }
    }

    function initOrbitalCanvas() {
        orbitalCanvas.width = w;
        orbitalCanvas.height = h;
        orbitalCtx = orbitalCanvas.getContext('2d');
        orbitalCtx.clearRect(0, 0, w, h);
        isOrbitalCanvasInitialized = true;
    }

    // ToDo: canvas full screen options
    // ToDo: save/load settings
    // ToDo: Settings for inside color
    // ToDo: Julia distance estimation

    function initZoom() {
        if (!zoomBox) {
            zoomBox = {
                centerX: w / 2,
                centerY: h / 2,
                zoom: 0.5,
            };
        }
    }

    const zoomMax = 1;
    const zoomMin = 0.04;

    function handleKeyDown(e) {
        // console.log(e.key)
        if (e.key === 'z' && !isOrbital) {
            if (!zoomBox) {
                initZoom();
            } else {
                zoomBox = null;
            }
        } else if (e.key === 'o' && !zoomBox) {
            isOrbital = !isOrbital;
            isOrbitalCanvasInitialized = !isOrbital;
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
                    zoomBox = {...zoomBox, zoom: Math.max(zoomBox.zoom - 0.02, zoomMin)};
                    break;
                case '+':
                    zoomBox = {...zoomBox, zoom: Math.min(zoomBox.zoom + 0.02, zoomMax)};
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

    function handleZoomMouseMove(e: MouseEvent) {
        zoomBox = {...zoomBox, centerX: (e.offsetX * w) / canvasW, centerY: (e.offsetY * h) / canvasH};
    }

    function handleZoomWheel(e: WheelEvent) {
        zoomBox = {...zoomBox, zoom: Math.min(Math.max(zoomBox.zoom + e.deltaY * -0.001, zoomMin), zoomMax)};
        e.preventDefault();
    }

    function handleOrbitalMouseMove(e: MouseEvent) {
        const mouseCoords = pixelToComplex(e.offsetX, e.offsetY, canvasW, canvasH, coords);
        if (!isOrbitalCanvasInitialized) {
            initOrbitalCanvas();
        }
        const size = Math.floor(dpr) * 2;
        drawOrbit({
            type: FractalType.Mandelbrot,
            coords: {
                centerRe: mouseCoords[0],
                centerIm: mouseCoords[1],
                dRe: 0,
            },
            maxIter,
            xPixels: w,
            yPixels: h,
            plotDots(data) {
                // clear canvas
                orbitalCtx.clearRect(0, 0, w, h);
                orbitalCtx.fillStyle = 'white';
                // draw points on canvas
                for (let i = 0; i < data.length; i += 2) {
                    orbitalCtx.fillRect(data[i], data[i + 1], size, size);
                }
            },
        });
    }

    function handleTypeChange(newType: FractalType, prevType: FractalType) {
        const newBaseType = getBaseType(newType);
        const filtered = filterCoordsHistory(type);
        if (newBaseType != getBaseType(prevType)) {
            if (newBaseType === FractalType.Julia) {
                // Fractal type was changed to Julia
                // Update Julia c-value from Mandelbrot coordinates
                juliaCoords = coords;
            }
            // Set coords to last history item or to default
            if (filtered.length) {
                coords = tail(filtered).coords;
            } else {
                coords =
                    newBaseType === FractalType.Julia
                        ? {
                              centerRe: 0,
                              centerIm: 0,
                              dRe: 3.0769,
                          }
                        : {
                              centerRe: -0.7,
                              centerIm: 0,
                              dRe: 3.0769,
                          };
            }
        }
    }
</script>

<div class="layout">
    <div id="fractal" bind:clientWidth={canvasW} bind:clientHeight={canvasH}>
        <canvas bind:this={canvas} class={classNames(aspectRatioClassNames[size], {opacity05: isOrbital})} />
        {#if zoomBox}
            <svg
                viewBox="0 0 {w} {h}"
                xmlns="http://www.w3.org/2000/svg"
                class="overlay"
                on:mousemove={handleZoomMouseMove}
                on:wheel={handleZoomWheel}
            >
                <path
                    d="M0,0 h{w} v{h} h{-w} v{-h} z M{zoomBox.centerX - (w * zoomBox.zoom) / 2},{zoomBox.centerY -
                        (h * zoomBox.zoom) / 2} h{w * zoomBox.zoom} v{h * zoomBox.zoom} h{-(w * zoomBox.zoom)} v{-h *
                        zoomBox.zoom} z"
                    fill="black"
                    fill-rule="evenodd"
                    opacity="0.5"
                    stroke="none"
                />
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
        {#if isOrbital}
            <canvas class="overlay" bind:this={orbitalCanvas} on:mousemove={handleOrbitalMouseMove} />
        {/if}
    </div>
    <div id="info">
        <Select
            label="Type"
            options={fractalTypeOptions}
            bind:value={type}
            disabled={isOrbital || zoomBox}
            onChange={handleTypeChange}
        />
        <Select
            label="Size"
            bind:value={size}
            options={[
                {name: '4:3', value: '4:3'},
                {name: '16:10', value: '16:10'},
                {name: '16:9', value: '16:9'},
            ]}
        />
        <div class="value-container">
            <div>Width</div>
            <div>{w}</div>
        </div>
        <div class="value-container">
            <div>Height</div>
            <div>{h}</div>
        </div>
        <br />
        <CoordInput bind:value={coords} />
        <br />
        {#if getBaseType(type) === FractalType.Julia}
            <CoordInput bind:value={juliaCoords} isParamC />
            <br />
        {/if}
        <NumberInput label="Max. iterations" bind:value={maxIter} min="30" max="999999" />
        <NumberInput label="Web workers" bind:value={workerCount} min="1" max="8" />
        <Select
            label="Color scheme"
            bind:value={colorOptions.scheme}
            options={Object.keys(colorSchemes).map(o => ({name: o, value: o}))}
        />
        {#if type === FractalType.Mandelbrot || type === FractalType.Julia}
            <NumberInput label="Color cycles" bind:value={colorOptions.cycles} min="1" max="100" />
        {:else}
            <NumberInput label="Distance limit" bind:value={colorOptions.distLimit} />
        {/if}
        <div
            class="value-container"
            on:click={() => {
                colorOptions = {...colorOptions, reversed: !colorOptions.reversed};
            }}
        >
            <div>Reversed colors</div>
            <div>{colorOptions.reversed ? 'yes' : 'no'}</div>
        </div>
        <button on:click={renderFractal} disabled={isBusy}>{isBusy ? 'Working..' : 'Redraw'}</button>
        <br />
        {#if zoomBox}
            <br />
            Zoom {zoomBox.zoom}<br />
            Center real {zoomCoords[0]}<br />
            Center imag {zoomCoords[1]}i<br />
            Diameter real {coords.dRe * zoomBox.zoom}<br />
            <p>
                Press SPACE or ENTER to redraw with zoom, + or - to change box size, "z" or "ESC" to end zoom mode. Move
                the box with arrow keys or the mouse.
            </p>
        {:else if isOrbital}
            <p>Move the pointer over the image to display orbits. Press "o" to end orbital mode.</p>
        {:else}
            <p>
                Press "z" to activate zoom mode.<br />
                Press "o" to activate orbital mode.
            </p>
        {/if}
        Coordinates history
        <CoordsHistory
            items={filterCoordsHistory(type)}
            onSelect={newCoords => {
                coords = newCoords;
                renderFractal();
            }}
        />
    </div>
    <div class="footer">
        Christian Bergmiller 2021
        <a href="https://github.com/cbergmiller/web-fractal">https://github.com/cbergmiller/web-fractal</a>
    </div>
</div>

<svelte:window on:keydown={handleKeyDown} />

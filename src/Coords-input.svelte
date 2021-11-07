<script lang="ts">
    export let value = undefined;
    export let isParamC = false;
    let isForm = false;
    let formValue = '';

    function handleChange() {
        isForm = false;
        const lines = formValue.split(/\r?\n/);
        if (lines.length >= (isParamC ? 2 : 3)) {
            value = {
                centerRe: parseFloat(lines[0]),
                centerIm: parseFloat(lines[1].replace('i', '')),
                dRe: isParamC ? 0 : parseFloat(lines[2]),
            };
        } else {
            console.log(lines);
        }
    }
</script>

<div
    on:click={() => {
        if (!isForm) {
            formValue = isParamC
                ? `${value.centerRe}\n${value.centerIm}`
                : `${value.centerRe}\n${value.centerIm}\n${value.dRe}`;
            isForm = true;
        }
    }}
    class="value-container"
>
    {#if !isForm}
        <div>
            {#if !isParamC}
                Center real<br />
                Center imag<br />
                Diameter real
            {:else}
                c real<br />
                c imag<br />
            {/if}
        </div>
        <div>
            {value.centerRe}<br />
            {value.centerIm}i<br />
            {#if !isParamC}{value.dRe}{/if}
        </div>
    {:else}
        <label for="coords">
            {#if !isParamC}
                Center real<br />
                Center imag<br />
                Diameter real
            {:else}
                c real<br />
                c imag<br />
            {/if}
        </label>
        <textarea name="coords" id="coords" bind:value={formValue} on:blur={handleChange} autofocus />
    {/if}
</div>

<style>
    textarea {
        resize: none;
        height: 100%;
        width: 100%;
    }
</style>

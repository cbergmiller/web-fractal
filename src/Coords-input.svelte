<script lang="ts">
    export let value = undefined;
    let isForm = false;
    let formValue = '';

    function handleChange() {
        isForm = false;
        const lines = formValue.split(/\r?\n/);
        if (lines.length >= 3) {
            value = {
                centerRe: parseFloat(lines[0]),
                centerIm: parseFloat(lines[1].replace('i', '')),
                dRe: parseFloat(lines[2]),
            };
        } else {
            console.log(lines);
        }
    }
</script>

<div
    on:click={() => {
        if (!isForm) {
            formValue = `${value.centerRe}\n${value.centerIm}\n${value.dRe}`;
            isForm = true;
        }
    }}
    class="value-container"
>
    <div>
        Center Real<br />
        Center Imag<br />
        Diameter Real
    </div>
    <div>
        {#if !isForm}
            {value.centerRe}<br />
            {value.centerIm}i<br />
            {value.dRe}
        {:else}
            <textarea bind:value={formValue} on:blur={handleChange} />
        {/if}
    </div>
</div>

<style>
    textarea {
        resize: none;
        height: 100%;
        width: 100%;
    }
</style>

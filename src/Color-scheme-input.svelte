<script lang="ts">
    import {colorSchemes} from './fractal';

    export let value;
    let isForm = false;
    let formValue;

    function handleChange() {
        isForm = false;
        value = formValue;
    }
</script>

<div
    class="value-container"
    on:click={() => {
        formValue = value;
        isForm = true;
    }}
>
    <div>Color Scheme</div>
    <div>
        {#if isForm}
            <select
                bind:value={formValue}
                on:change={handleChange}
                on:blur={() => {
                    isForm = false;
                }}
            >
                {#each Object.keys(colorSchemes) as scheme}<option value={scheme}>{scheme}</option>{/each}
            </select>
        {:else}
            {value}
        {/if}
    </div>
</div>

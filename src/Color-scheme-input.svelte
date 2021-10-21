<script>
    import {colorSchemes} from './fractal';

    export let value;
    let isForm = false;
    let formValue;

    function handleChange() {
        isForm = false;
        value = formValue;
    }
</script>

<label
    on:click={() => {
        formValue = value;
        isForm = true;
    }}
>
    Color Scheme:
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
</label>

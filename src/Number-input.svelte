<script>
    export let label = '';
    export let value = 0;
    export let min = undefined;
    export let max = undefined;
    let isForm = false;
    let formValue = 0;

    function handleChange() {
        isForm = false;
        if (!isNaN(formValue) && formValue !== null) {
            value = formValue;
        }
    }
</script>

<label
    on:click={() => {
        formValue = value;
        isForm = true;
    }}
>
    {label}
    {#if isForm}
        <input
            type="number"
            min={min}
            max={max}
            bind:value={formValue}
            on:blur={handleChange}
        />
    {:else}
        {value}
    {/if}
</label>

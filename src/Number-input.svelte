<script lang="ts">
    export let label = '';
    export let value = 0;
    export let min = undefined;
    export let max = undefined;
    let isForm = false;
    let formValue = 0;
    let lastBlur = null;

    function handleChange() {
        isForm = false;
        if (!isNaN(formValue) && formValue !== null) {
            value = formValue;
        }
        lastBlur = Date.now().valueOf();
    }
</script>

<div
    class="value-container"
    on:click={() => {
        if (!isForm) {
            if (lastBlur && Date.now().valueOf() - lastBlur < 400) return;
            formValue = value;
            isForm = true;
        }
    }}
>
    {#if isForm}
        <label for={label}>{label}</label>
        <input
            id={label}
            name={label}
            type="number"
            {min}
            {max}
            bind:value={formValue}
            on:blur={handleChange}
            autofocus
        />
    {:else}
        <div>{label}</div>
        <div>{value}</div>
    {/if}
</div>

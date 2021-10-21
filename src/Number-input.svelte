<script lang="ts">
    export let label = '';
    export let value = 0;
    export let min = undefined;
    export let max = undefined;
    let isForm = false;
    let formValue = 0;

    function handleChange() {
        console.log('blur')
        isForm = false;
        if (!isNaN(formValue) && formValue !== null) {
            value = formValue;
        }
    }
</script>

<div
    class="value-container"
    on:click={() => {
        console.log(isForm)
        if (!isForm) {
            formValue = value;
            isForm = true;
        }
    }}
>
    <div>{label}</div>
    <div>
        {#if isForm}
            <input type="number" {min} {max} bind:value={formValue} on:blur={handleChange} />
        {:else}
            {value}
        {/if}
    </div>
</div>

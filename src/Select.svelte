<script lang="ts">
    import {SelectOption} from './models';
    export let label: string;
    export let value: string | number;
    export let options: SelectOption[];
    export let disabled = false;
    let isForm = false;
    let formValue;

    function handleChange() {
        if (disabled) return;
        isForm = false;
        value = formValue;
    }
</script>

<div
    class="value-container"
    on:click={() => {
        if (disabled) return;
        formValue = value;
        isForm = true;
    }}
>
    <div>{label}</div>
    <div>
        {#if isForm}
            <select
                bind:value={formValue}
                on:change={handleChange}
                on:blur={() => {
                    isForm = false;
                }}
            >
                {#each options as option}<option value={option.value}>{option.name}</option>{/each}
            </select>
        {:else}
            {options.find(o => o.value === value)?.name ?? '-'}
        {/if}
    </div>
</div>

<script lang="ts">
    import {SelectOption} from './models';
    export let label: string;
    export let value: string | number;
    export let options: SelectOption[];
    export let disabled = false;
    export let onChange: undefined;
    let isForm = false;
    let formValue;
    let lastBlur = null;

    function handleChange() {
        if (disabled) return;
        isForm = false;
        const prevValue = value;
        value = formValue;
        if (onChange) {
            onChange(formValue, prevValue);
        }
    }
</script>

<div
    class="value-container"
    on:click={() => {
        if (disabled) return;
        if (lastBlur && Date.now().valueOf() - lastBlur < 400) return;
        formValue = value;
        isForm = true;
    }}
>
    {#if isForm}
        <label for={label}>{label}</label>
        <select
            id={label}
            name={label}
            bind:value={formValue}
            on:change={handleChange}
            on:blur={() => {
                isForm = false;
                lastBlur = Date.now().valueOf();
            }}
            autofocus
        >
            {#each options as option}<option value={option.value}>{option.name}</option>{/each}
        </select>
    {:else}
        <div>{label}</div>
        <div>{options.find(o => o.value === value)?.name ?? '-'}</div>
    {/if}
</div>

<script lang="ts">
    import {CoordsHistoryItem} from './models';

    export let onSelect = undefined;
    export let items: CoordsHistoryItem[] = [];
    let showAll = false;

    function toggleShowAll() {
        showAll = !showAll;
    }
</script>

<div class="coords-history">
    {#each showAll ? items : items.slice(Math.max(items.length - 5, 0)) as item}
        <div on:click={() => onSelect(item.coords)}>
            cRe {item.coords.centerRe}
            cIm {item.coords.centerIm}i dRe {item.coords.dRe}
            {item.date.toLocaleTimeString()}
        </div>
    {/each}
    {#if items.length > 5}
        <button on:click={toggleShowAll}>
            {#if !showAll}Show all{:else}Show less{/if}
        </button>
    {/if}
</div>

<style>
    .coords-history > div {
        cursor: pointer;
        border-bottom: solid 1px gray;
    }
    .coords-history > div:first-child {
        border-top: solid 1px gray;
    }
    button {
        width: 100%;
    }
</style>

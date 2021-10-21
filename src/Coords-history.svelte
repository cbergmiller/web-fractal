<script lang="ts">
    import {CoordsHistoryItem} from './models';

    export let items: CoordsHistoryItem[] = [];
</script>

<div>
    {#each items as item}
        <div>
            {item.coords.centerRe}
            {item.coords.centerIm}i
            {item.coords.dRe}
            {item.date.toLocaleTimeString()}
        </div>
    {/each}
</div>

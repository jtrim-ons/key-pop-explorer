<script>
  import Em from "$lib/ui/Em.svelte";
  import Tile from "$lib/layout/partial/Tile.svelte";

  import { texts } from "$lib/config";
  import { calcPopPercentString } from "$lib/utils";

  export let data;
</script>

<Tile title="Population">
  {#if data.selected.total_pop.count == null}
    <div class="num-desc">{texts.nodata}</div>
  {:else}
    <div class="num-big">
      {data.selected.total_pop.count.toLocaleString()}
    </div>
    <div class="num-suffix">people</div>
    <div class="num-desc">
      <Em color="lightgrey" />{calcPopPercentString(
        data.selected.total_pop.percent
      )}% of the total population of England and Wales
    </div>
  {/if}
</Tile>

<style>
  .num-big {
    display: block;
    font-size: 3rem;
    font-weight: bold;
    line-height: 1.2;
  }
  .num-suffix {
    display: block;
    max-width: 100%;
    margin-left: 2px;
  }
  .num-desc {
    /* TODO share code with .num-desc in index.svelte? */
    display: block;
    margin-top: 10px;
    color: #707070;
    font-size: 14px;
    line-height: 1.3;
  }
</style>

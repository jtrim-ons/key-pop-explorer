<script>
  import Tile from "$lib/layout/partial/Tile.svelte";
  import ProfileChart from "$lib/chart/ProfileChart.svelte";

  import { texts, codes } from "$lib/config";
  import { makeDataNew, computeAgeMaskRange } from "$lib/utils";

  export let data;
  export let selected;
</script>

<Tile title="Age profile">
  {#if data.selected.residents.resident_age_18b.values === "blocked"}
    <span class="num-desc">{texts.nodata}</span>
  {:else if data.selected.residents.resident_age_18b.values.percent[0] == null}
    <span class="num-desc">{texts.nodata}</span>
  {:else}
    <ProfileChart
      data={data.selected &&
        makeDataNew("residents", "resident_age_18b", data, codes)}
      zKey="group"
      maskRange={computeAgeMaskRange(selected)}
    />
  {/if}
</Tile>

<style>
  .num-desc {
    /* TODO share code with .num-desc in index.svelte? */
    display: block;
    margin-top: 10px;
    color: #707070;
    font-size: 14px;
    line-height: 1.3;
  }
</style>

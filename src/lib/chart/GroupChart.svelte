<script>
  export let data;
  export let xKey = "value";
  export let yKey = "category";
  export let zKey = "group";
  export let formatTick = (d) => Math.round(d);
  export let suffix = "%";
  export let barHeight = 20;
  export let margin = 30;

  function groupData(data, key) {
    let data_indexed = {};
    for (const d of data) {
      if (!data_indexed[d[key]]) {
        data_indexed[d[key]] = {
          label: d[key],
          values: [],
        };
      }
      data_indexed[d[key]].values.push(d);
    }

    let data_grouped = [];
    for (const key in data_indexed) {
      data_grouped.push(data_indexed[key]);
    }

    return data_grouped;
  }

  $: xDomain = [0, Math.max(...data.map((d) => d[xKey]))];
  $: yDomain = data.map((d) => d[yKey]).filter((v, i, a) => a.indexOf(v) === i);
  $: zDomain = data.map((d) => d[zKey]).filter((v, i, a) => a.indexOf(v) === i);

  $: xScale = (value) => (value / xDomain[1]) * 100;

  $: data_grouped = groupData(data, yKey);
</script>

{#if zDomain[1]}
  <ul class="legend-block">
    {#each zDomain as group, i}
      <li>
        <div class="legend-vis {i == 0 ? 'bar' : 'bar2'}" />
        <span class:bold={i == 0}>{group}</span>
      </li>
    {/each}
  </ul>
{/if}

{#each data_grouped as group}
  <div class="label-group">
    {group.label}
  </div>
  <div
    class="bar-group"
    style:height="{zDomain[1] ? barHeight * 2 : barHeight}px"
    style:width="calc(100% - {margin}px)"
  >
    {#each group.values as d, i}
      <div
        class={i == 0 ? "bar" : "bar2"}
        style:left="0"
        style:width="{xScale(d[xKey])}%"
        style:top={i == 0 ? "0" : "50%"}
        style:height={zDomain[1] ? "50%" : "100%"}
      />
      <div
        class="label"
        class:bold={i == 0}
        style:left="calc({xScale(d[xKey])}% + 2px)"
        style:top={i == 0 ? "0" : "50%"}
        style:height="50%"
      >
        {formatTick(d[xKey])}{suffix}
      </div>
    {/each}
  </div>
{/each}

<style>
  .bold {
    font-weight: bold;
  }
  .label-group {
    margin: 4px 0 1px 0;
    line-height: 1.2;
    font-size: 0.9rem;
  }
  .label {
    line-height: 1.2;
    font-size: 0.9rem;
  }
  .bar-group {
    display: block;
    position: relative;
  }
  .bar-group > div {
    position: absolute;
    top: 0;
  }
  .bar {
    background-color: #206095;
  }
  .bar2 {
    background-color: #aaa;
  }
  ul.legend-block {
    list-style-type: none;
    padding: 0;
    margin: 0 0 5px 0;
  }
  ul.legend-block > li {
    display: inline-block;
    margin: 0 10px 0 0;
    padding: 0;
  }
  .legend-vis {
    display: inline-block;
    transform: translate(0, 4px);
    width: 1rem;
    height: 1rem;
  }
</style>

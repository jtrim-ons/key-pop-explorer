<script context="module">
  export const prerender = false;

  import { getTopo, getData, removeCategoryCountFromName } from "$lib/utils";
  import {
    ladBounds,
    datasets,
    newDatasets,
    colors,
    populationBases,
  } from "$lib/config";
  import { base, assets } from "$app/paths";

  export async function load({ fetch }) {
    let geojson = await getTopo(assets + ladBounds.url, ladBounds.layer, fetch);

    let geoLookup = {};
    geojson.features.forEach(
      (d) =>
        (geoLookup[d.properties[ladBounds.code]] = d.properties[ladBounds.name])
    );

    let dataAll = (await getData(newDatasets, [], fetch)).data;
    dataAll.total_pop = makeSum(dataAll.residents.sex.values.count);

    let geoPerc = [];

    let geoCodes = geojson.features.map((d) => d.properties[ladBounds.code]);

    geoCodes.forEach((code) => {
      geoPerc.push({ code: code, name: geoLookup[code], value: 100 });
    });
    geoPerc.forEach((d) => (d.color = colors.seq[4]));

    return {
      props: { geojson, geoLookup, dataAll, geoCodes, geoPerc },
    };
  }
</script>

<script>
  import { page } from "$app/stores";
  import { goto, afterNavigate } from "$app/navigation";
  import { setContext } from "svelte";
  import { ckmeans } from "simple-statistics";
  import {
    getColor,
    capitalise,
    makeSum,
    isNA,
    suffixer,
    changeClass,
    changeStr,
  } from "$lib/utils";
  import {
    themes,
    vars,
    varsNested,
    codes,
    mapStyle,
    texts,
    arrow,
    spacer,
    unblockedCombinationCounts,
    maskRanges,
  } from "$lib/config";
  import Titleblock from "$lib/layout/Titleblock.svelte";
  import Headline from "$lib/layout/partial/Headline.svelte";
  import ProfileChart from "$lib/chart/ProfileChart.svelte";
  import BreaksChart from "$lib/chart/BreaksChart.svelte";
  import BarChart from "$lib/chart/BarChart.svelte";
  import GroupChart from "$lib/chart/GroupChart.svelte";
  import Table from "$lib/chart/Table.svelte";
  import Map from "$lib/map/Map.svelte";
  import MapSource from "$lib/map/MapSource.svelte";
  import MapLayer from "$lib/map/MapLayer.svelte";
  import Content from "$lib/layout/Content.svelte";
  import Tiles from "$lib/layout/Tiles.svelte";
  import Tile from "$lib/layout/partial/Tile.svelte";
  import Em from "$lib/ui/Em.svelte";
  import OptionPicker from "$lib/ui/OptionPicker.svelte";

  export let geojson, geoLookup, dataAll, geoCodes, geoPerc;

  // STYLE CONFIG
  // Set theme globally (options are 'light' or 'dark')
  let theme = "light";
  setContext("theme", themes[theme]);

  // Elements
  let map = null;

  // State
  let active = null;
  let active_cats = {};
  let selected = [];
  vars.forEach((d) => {
    active_cats[d.label] = d.cats[0];
  });
  let hovered = null;
  let status = "success"; // Options: success, fail, loading
  let u16 = false; // If age selection is 0-15 some tables won't show data
  let varcount = 0; // Number of variables successfully loaded
  let chart_type = BarChart;

  $: ops = vars.filter((d) => !selected.map((d) => d.topic).includes(d.label));

  const getUnblockedCount = (op) =>
    unblockedCombinationCounts[
      [...selected.map((d) => d.key), op.key]
        .sort((a, b) => a.localeCompare(b))
        .join(",")
    ];

  // Data
  let data = {
    all: dataAll,
    selected: dataAll,
    geojson,
    geoLookup,
    geoCodes,
    geoPerc,
    geoBreaks: [0, 100],
  };

  function doSelect(topic) {
    console.log(topic, active.shortLabel, active.key, active_cats[topic]);
    selected = [
      ...selected,
      { topic: active.shortLabel, key: active.key, ...active_cats[topic] },
    ];
    goto(`${base}?${selected.map((d) => `${d.key}=${d.code}`).join("&")}`, {
      noscroll: true,
    });
    active = null;
  }

  function doSelect2(variable, cat) {
    selected = [
      ...selected,
      { topic: variable.shortLabel, key: variable.key, ...cat },
    ];
    goto(`${base}?${selected.map((d) => `${d.key}=${d.code}`).join("&")}`, {
      noscroll: true,
    });
    active = null;
  }

  function unSelect(topic) {
    selected = selected.filter((d) => d.topic != topic);
    goto(`${base}?${selected.map((d) => `${d.key}=${d.code}`).join("&")}`, {
      noscroll: true,
    });
  }

  function groupsToBreaks(groups) {
    let breaks = [];
    groups.forEach((g) => breaks.push(g[0]));
    const endOfLastGroup = groups.flat().pop();
    if (groups.length === 1 || endOfLastGroup != breaks[breaks.length - 1])
      breaks.push(endOfLastGroup);
    return breaks;
  }

  function processData(d) {
    data.selected = d.data;
    data.selected.total_pop =
      selected.length === 0
        ? makeSum(dataAll.residents.sex.values.count)
        : d.total_pop;

    data.geoPerc = [];
    let groups = null;

    if (true) {
      // FIXME: check this against Ahmad's previous version,
      //     and probably create 100% data in Python for no selections.
      data.geoCodes.forEach((code) => {
        let value =
          selected.length === 0
            ? 100
            : d.mapData[code] != null
            ? d.mapData[code][1]
            : null;
        data.geoPerc.push({ code: code, name: data.geoLookup[code], value });
      });

      let vals = data.geoPerc.map((d) => d.value).filter((d) => d != null);
      groups =
        vals.length === 0 ? null : ckmeans(vals, Math.min(5, vals.length));
    } else {
      data.geoCodes.forEach((code) => {
        data.geoPerc.push({
          code: code,
          name: data.geoLookup[code],
          value: null,
        });
      });
    }

    if (groups == null) {
      data.geoPerc.forEach((d) => (d.color = colors.nodata));
      data.geoBreaks = [0, 100];
    } else if (selected.length === 0) {
      data.geoPerc.forEach((d) => (d.color = colors.seq[4]));
      data.geoBreaks = [100, 100];
    } else {
      let breaks = groupsToBreaks(groups);
      data.geoPerc.forEach(
        (d) =>
          (d.color =
            d.value != null
              ? getColor(d.value, breaks, colors.seq)
              : colors.nodata)
      );
      data.geoBreaks = breaks;
    }

    varcount = selected.length;
    status = "success";
  }

  function loadData() {
    status = "loading";
    u16 =
      selected &&
      selected.some((d) =>
        [
          "Aged 4 years and under",
          "Aged 5 to 9 years",
          "Aged 10 to 14 years",
          "Aged 15 years and under",
        ].includes(d.label)
      );
    getData(newDatasets, selected).then(processData);
  }

  function makeDataNew(props) {
    let group = props[0];
    let dataset = props[1];
    let valsAll = data.all[group][dataset].values;
    let valsSelected = data.selected[group][dataset].values;

    let arr = [];

    codes[dataset].forEach((cd, i) => {
      let label = cd.label;
      let valAll = valsAll.percent[i];
      let valSelected = valsSelected.percent[i];
      if (data.selected.total_pop != data.all.total_pop)
        arr.push({ group: "This group", category: label, value: valSelected });
      arr.push({ group: "Whole population", category: label, value: valAll });
    });

    return arr;
  }

  function refreshData() {
    selected = [];
    for (let pair of $page.url.searchParams.entries()) {
      let variable = vars.find((d) => d.key == pair[0]);
      if (!variable) continue;
      let category = variable.cats.find((d) => d.code == pair[1]);
      if (!category) continue;
      selected.push({
        topic: variable.shortLabel,
        key: variable.key,
        ...category,
      });
    }
    loadData();
  }

  function computeMaskRange(selected) {
    for (const s of selected)
      if (s.var in maskRanges) return maskRanges[s.var][s.code];

    return null;
  }

  afterNavigate(refreshData); // Refresh data when user navigates
</script>

<svelte:head>
  <title>Census Population Group Profiles</title>
  <meta name="description" content="" />
  <meta property="og:title" content="Census Population Group Profiles" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="{assets}/" />
  <meta property="og:image:type" content="image/jpeg" />
  <meta property="og:description" content="" />
  <meta name="description" content="" />
</svelte:head>

<Titleblock
  background="none"
  breadcrumb={[
    { label: "Census", url: "/census" },
    { label: "Population Group Profiles" },
  ]}
>
  <Headline>Population Group Profiles</Headline>
  <p class="subtitle">
    Select one or more identity characteristics to define a population group to
    compare with the whole population of England and Wales. For example, see <a
      href="?religion_tb=7&country_of_birth_3a=1">Sikhs born in the UK</a
    >
    or
    <a href="?resident_age_3a=3&country_of_birth_8a=2"
      >people aged 65+ born in Ireland</a
    >.
  </p>
  <div slot="meta" class="wrapper">
    <select bind:value={active} disabled={!ops}>
      <option value={null}
        >{selected.length
          ? "Select another characteristic"
          : "Select a characteristic"}</option
      >
      {#each ops as op, i}
        <option value={op}
          >{capitalise(op.label)} [{getUnblockedCount(op)} charts]</option
        >
      {/each}
    </select>
    <OptionPicker options={varsNested} catCallback={doSelect2} />

    {#if active}
      <select bind:value={active_cats[active.label]}>
        {#each active.cats as cat}
          <option value={cat}
            >{@html cat.indent
              ? Array.from({ length: cat.indent - 1 }, (v) => spacer).join("") +
                arrow
              : ""}{capitalise(cat.label)}</option
          >
        {/each}
      </select>
      <button class="btn" on:mouseup={() => doSelect(active.label)}>
        Add
      </button>
    {/if}

    {#if selected[0]}
      <br />
      {#each selected as item, i}
        {#if status == "loading" && i == selected.length - 1}
          <div class="chip chip-pending">
            <span>{capitalise(item.topic)}: {capitalise(item.label)}</span>
            <div class="chip-loader" />
          </div>
        {:else}
          <div class="chip">
            <span>{capitalise(item.topic)}: {capitalise(item.label)}</span>
            <button on:click={() => unSelect(item.topic)} />
          </div>
        {/if}
      {/each}
    {/if}

    {#if status == "failed" || u16 == true}
      <div class="warning">
        Some datasets not available for selected variables.
        {#if status == "failed"}
          Try removing a variable to see more datasets.
        {/if}
        {#if u16 == true}
          Economic indicators (employment, social status etc) not available for
          ages 0 to 15.
        {/if}
      </div>
    {/if}
  </div>
</Titleblock>

<Content>
  <Tiles title="Demographics">
    <Tile title="Population">
      {#if data.selected.total_pop == 0}
        <div class="num-desc">{texts.nodata}</div>
      {:else}
        <div class="num-big">{data.selected.total_pop.toLocaleString()}</div>
        <div class="num-suffix">
          people (TODO: calculate this percentage in Python)
        </div>
        <div class="num-desc">
          <Em color="lightgrey" />{data.selected.total_pop ===
          data.all.total_pop
            ? 100
            : ((data.selected.total_pop / data.all.total_pop) * 100).toFixed(
                1
              ) !== "0.0"
            ? ((data.selected.total_pop / data.all.total_pop) * 100).toFixed(1)
            : "Less than 0.05"}% of the total population of England and Wales
        </div>
      {/if}
    </Tile>
    <Tile title="Age profile">
      {#if data.selected.residents.resident_age_23a.values === "blocked"}
        <span class="num-desc">{texts.nodata}</span>
      {:else if isNA(data.selected.residents.resident_age_23a.values.percent)}
        <span class="num-desc">{texts.nodata}</span>
      {:else}
        <ProfileChart
          data={data.selected && makeDataNew(["residents", "resident_age_23a"])}
          zKey="group"
          maskRange={computeMaskRange(selected)}
        />
      {/if}
    </Tile>
  </Tiles>

  <Tiles title="Population by area">
    <Tile colspan={3} rowspan={1} blank>
      <p class="subtitle">
        For each lower-tier local authority area in England and Wales, the map
        shows the count of people in the categories chosen above as a percentage
        of the area's total population.
      </p>
    </Tile>
    <Tile colspan={2} rowspan={2} blank>
      <div style:height="450px">
        <Map bind:map style={mapStyle}>
          {#if data.geojson && data.geoPerc}
            <MapSource
              id="lad"
              type="geojson"
              data={data.geojson}
              promoteId={ladBounds.code}
            >
              <MapLayer
                id="lad-fill"
                data={data.geoPerc}
                geoCode="code"
                nameCode="name"
                colorCode="color"
                valueCode="value"
                hover={true}
                bind:hovered
                tooltip={true}
                type="fill"
                paint={{
                  "fill-color": [
                    "case",
                    ["!=", ["feature-state", "color"], null],
                    ["feature-state", "color"],
                    "rgba(255, 255, 255, 0)",
                  ],
                  "fill-opacity": 0.8,
                }}
                order="highway_name_other"
              />
              <MapLayer
                id="lad-line"
                type="line"
                paint={{
                  "line-color": "orange",
                  "line-width": 2,
                  "line-opacity": [
                    "case",
                    ["==", ["feature-state", "hovered"], true],
                    1,
                    0,
                  ],
                }}
                order="highway_name_other"
              />
            </MapSource>
          {/if}
        </Map>
      </div>
      {#if data.geoBreaks && data.geoPerc}
        <div style:height="38px" style:width="100%">
          <BreaksChart
            breaks={data.geoBreaks}
            hovered={hovered && data.geoPerc.find((d) => d.code == hovered)
              ? data.geoPerc.find((d) => d.code == hovered).value
              : null}
            colors={data.geoBreaks[1] == 100 ? [colors.seq[4]] : colors.seq}
          />
        </div>
      {/if}
    </Tile>
    <Tile title="Areas with high %">
      {#if data.geoPerc && selected[0]}
        <Table
          data={[...data.geoPerc]
            .filter((d) => d.value != null)
            .sort((a, b) => b.value - a.value)
            .slice(0, 5)}
        />
      {:else}
        <span class="muted">Make a selection to see rankings.</span>
      {/if}
    </Tile>
    <Tile title="Areas with low %">
      {#if data.geoPerc && selected[0]}
        <Table
          data={data.geoPerc
            .filter((d) => d.value != null)
            .sort((a, b) => b.value - a.value)
            .slice(-5)}
          offset={data.geoPerc.filter((d) => d.value != null).length - 4}
        />
      {:else}
        <span class="muted">Make a selection to see rankings.</span>
      {/if}
    </Tile>
  </Tiles>

  <!-- <span slot="meta" style:margin-left="10px"> -->
  <span>
    <strong>Chart type:</strong>
    <label
      ><input
        type="radio"
        bind:group={chart_type}
        name="chart-type"
        value={BarChart}
      />Comparison marker</label
    >
    <label
      ><input
        type="radio"
        bind:group={chart_type}
        name="chart-type"
        value={GroupChart}
      />Grouped bar</label
    >
  </span>

  {#each newDatasets[0].tablesCategorised as category}
    <Tiles title={category.categoryName}>
      {#each category.tables.filter((t) => !t.code.startsWith("resident_age") && data.selected.residents[t.code].values !== "blocked" && data.selected.residents[t.code].values !== undefined) as table}
        <Tile title={removeCategoryCountFromName(table.key)}>
          <!-- FIXME: check for missing data -->
          {#if data.selected.residents[table.code].values === "blocked"}
            <span class="num-desc">{texts.blocked}</span>
          {:else if data.selected.residents[table.code].values.percent[0] == null}
            <span class="num-desc">{texts.nodata}</span>
          {:else}
            <svelte:component
              this={chart_type}
              data={data.selected && makeDataNew(["residents", table.code])}
            />
          {/if}
          <span class="num-desc">% of {populationBases[table.code]}</span>
        </Tile>
      {/each}
    </Tiles>
  {/each}
</Content>

<style>
  :global(.tile) {
    color: black;
    font-size: 1rem;
  }
  :global(p) {
    font-size: 1rem;
  }
  :global(.mapboxgl-ctrl-icon) {
    visibility: visible !important;
  }
  a {
    color: #206095;
    text-decoration: underline;
  }
  a:hover {
    color: rgb(0, 60, 87);
  }
  .subtitle {
    margin: 8px 0;
  }
  .btn {
    padding: 2px 4px;
    margin: 0;
    border: 2px solid #206095;
    cursor: pointer;
    color: #206095;
    background-color: lightgrey;
  }
  .muted {
    color: grey;
  }
  select {
    appearance: none;
    background: white
      url("https://ons-design-system.netlify.app/img/icons--chevron-down.svg")
      padding-box no-repeat;
    background-position: calc(100% - 10px) 50%;
    background-size: 18px;
    border: 1.5px solid rgb(34, 34, 34);
    outline: 1.5px solid white;
    border-radius: 3px;
    padding: 7px 36px 7px 9px;
    margin: 8px 0;
    font-size: 1rem;
  }
  select:focus {
    outline-color: rgb(34, 34, 34);
    box-shadow: 0 0 0 4px orange;
  }
  button {
    cursor: pointer;
  }
  .btn {
    color: white;
    background: #0f8243;
    font-weight: bold;
    border: 0;
    border-radius: 3px;
    box-shadow: 0 3px #193c23;
    padding: 7px 20px;
    transform: translate(0, -1.5px);
  }
  .btn:hover {
    background-color: #30693c;
  }
  .btn:active {
    box-shadow: none;
    transform: translate(0, 1.5px);
  }
  .warning {
    background-color: #fef4ee;
    border: none;
    border-left: 5px solid #ff803b;
    padding: 10px;
    font-size: 0.9rem;
    margin-bottom: 5px;
  }
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
    display: block;
    margin-top: 10px;
    color: #707070;
    font-size: 14px;
    line-height: 1.3;
  }

  .chip {
    display: inline-flex;
    vertical-align: middle;
    background-color: rgb(231, 243, 236);
    font-size: 0.9rem;
    border: 1.5px solid #0f8243;
    border-radius: 3px;
    padding: 5px;
    margin: 0 5px 5px 0;
    line-height: normal;
  }
  .chip-pending {
    background-color: #fef4ee;
    border-color: #ff803b;
  }
  .chip span {
    padding: 0 10px;
  }
  .chip button {
    background: #0f8243
      url("https://bothness.github.io/geo-draw/img/x-close.svg") no-repeat
      center;
    margin: 0;
    width: 20px;
    height: 20px;
    border: none;
    border-radius: 50%;
  }
  .chip-loader {
    box-sizing: border-box;
    border: 5px solid rgba(0, 0, 0, 0.2);
    border-radius: 50%;
    border-top: 5px solid #ff803b;
    border-right: 5px solid #ff803b;
    width: 20px;
    height: 20px;
    -webkit-animation: spin 2s linear infinite; /* Safari */
    animation: spin 0.75s linear infinite;
  }
  /* Safari */
  @-webkit-keyframes spin {
    0% {
      -webkit-transform: rotate(0deg);
    }
    100% {
      -webkit-transform: rotate(360deg);
    }
  }
  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
</style>

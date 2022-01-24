<script context="module">
	export const prerender = false;

  import { getTopo, getData, getGeo } from "$lib/utils";
	import { ladBounds, datasets, colors } from "$lib/config";

	export async function load({ fetch }) {
    let geojson = await getTopo(ladBounds.url, ladBounds.layer, fetch);

    let geoLookup = {};
    geojson.features.forEach(d => geoLookup[d.properties[ladBounds.code]] = d.properties[ladBounds.name]);

    let json = await getData(datasets, [], fetch);
    let sumAll = makeSum(json.data.residents.health.values);
		let dataAll = json.data;

    let geo = await getGeo([], fetch);
    let geoPerc = [];

    let categories = geo.data.dataset.table.dimensions[0].categories;
		let geoCodes = categories.map(d => d.code.slice(-9));
    let values = geo.data.dataset.table.values;

    let geoAll = {};
    geoCodes.forEach((code, i) => {
      geoAll[code] = values[i];
    });
    geoCodes.forEach(code => {
      geoPerc.push({code: code, name: geoLookup[code], value: 100});
    });
    geoPerc.forEach(d => d.color = colors.seq[4]);
    
    return {
			props: { geojson, geoLookup, sumAll, dataAll, geoAll, geoCodes, geoPerc }
		}
	}
</script>
<script>
  import { base, assets } from "$app/paths";
  import { page } from '$app/stores';
  import { goto, afterNavigate } from '$app/navigation';
  import { setContext } from "svelte";
	import { ckmeans } from "simple-statistics";
	import { getColor, capitalise, makeSum, isNA, suffixer, changeClass, changeStr } from "$lib/utils";
	import { themes, vars, codes, mapStyle, texts, arrow, spacer } from "$lib/config";
  import Section from "$lib/layout/Section.svelte";
	import ColChart from "$lib/chart/ColChart.svelte";
	import StackedBarChart from "$lib/chart/StackedBarChart.svelte";
	import Map from "$lib/map/Map.svelte";
	import MapSource from "$lib/map/MapSource.svelte";
	import MapLayer from "$lib/map/MapLayer.svelte";
	import SpineChart from "$lib/chart/SpineChart.svelte";

  export let geojson, geoLookup, sumAll, dataAll, geoAll, geoCodes, geoPerc;

  // STYLE CONFIG
  // Set theme globally (options are 'light' or 'dark')
  let theme = "light";
  setContext("theme", themes[theme]);
	
	// Elements
	let w, cols;
	let map = null;

	// State
	let active = null;
	let active_cats = {};
	let selected = [];
	vars.forEach(d => {
		active_cats[d.label] = d.cats[0];
	});
	let hovered = null;
	let status = 'success'; // Options: success, fail, loading
	let u16 = false; // If age selection is 0-15 some tables won't show data
	let varcount = 0; // Number of variables successfully loaded

	$: ops = vars.filter(d => !selected.map(d => d.topic).includes(d.label));

	// Data
	let data = {
		all: dataAll,
		selected: dataAll,
		geojson,
		geoLookup,
		geoCodes,
		geoAll,
		geoPerc,
		geoBreaks: [0, 100]
	};
	let sum = {
		all: sumAll,
		selected: sumAll
	}
	
	function doSelect(topic) {
		selected = [...selected, {topic: active.label, key: active.key, ...active_cats[topic]}];
    goto(`?${selected.map(d => `${d.key}=${d.code}`).join('&')}`);
		active = null;
	}
	
	function unSelect(topic) {
		selected = selected.filter(d => d.topic != topic);
		goto(`?${selected.map(d => `${d.key}=${d.code}`).join('&')}`);
	}

	function loadData() {
		status = 'loading';

		if (selected && selected.map(d => d.code).includes('0-15')) {
			u16 = true;
		} else {
			u16 = false;
		}

		getData(datasets, selected)
		.then(json => {
			if (json.data.residents.age.values) {
				sum.selected = makeSum(json.data.residents.health.values);
				data.selected = json.data;

				getGeo(selected)
				.then(json => {
					let array = [];
					let groups = null;

					if (json.data.dataset.table.dimensions) {
						let categories = json.data.dataset.table.dimensions[0].categories;
						let codes = categories.map(d => d.code.slice(-9));
					
						let values = json.data.dataset.table.values;

						let index = {};
						codes.forEach((code, i) => {
							index[code] = values[i];
						});

						data.geoCodes.forEach(code => {
							array.push({code: code, name: data.geoLookup[code], value: index[code] ? (index[code] / data.geoAll[code]) * 100 : null});
						});

						let vals = array.map(d => d.value).filter(d => d != null);
						groups = vals[4] ? ckmeans(vals, 5) : null;
					} else {
						data.geoCodes.forEach(code => {
							array.push({code: code, name: data.geoLookup[code], value: null});
						});
					}

					if (groups == null) {
						array.forEach(d => d.color = colors.nodata);
						data.geoBreaks = [0, 100];
					} else if (!groups[1]) {
						array.forEach(d => d.color = colors.seq[4]);
						data.geoBreaks = [0, 100];
					} else {
						let breaks = [];
						groups.forEach(grp => breaks.push(grp[0]));
						breaks.push(groups[groups.length - 1][groups[groups.length - 1].length - 1]);
						if (breaks[breaks.length - 1] == breaks[breaks.length - 2]) {
							breaks.pop();
						}
						array.forEach(d => d.color = d.value ? getColor(d.value, breaks, colors.seq) : colors.nodata);
						data.geoBreaks = breaks;
					}

					data.geoPerc = array;
					varcount = selected.length;
					status = 'success';
				});
			} else {
				status = 'failed';
			}
		});
	}
	
	function makeData(props) {
		let group = props[0];
		let dataset = props[1];
		let valsAll = data.all[group][dataset].values;
		let valsSelected = data.selected[group][dataset].values;

		let arr = [];
		let sumAll = 0;
		let sumSelected = 0;

		codes[dataset].forEach(cd => {
			let label = cd.label;
			let valAll = 0;
			let valSelected = 0;
			cd.cells.forEach(i => {
				valAll += valsAll[i];
				sumAll += valsAll[i];

				valSelected += valsSelected[i];
				sumSelected += valsSelected[i];
			});
			arr.push({x: label, yVal: valSelected, zVal: valAll});
		});

		arr.forEach(d => {
			d.y = (d.yVal / sumSelected) * 100;
			d.z = (d.zVal / sumAll) * 100;
		});

		return arr;
	}

	function getMedianAge(dataset) {
		let values = dataset.residents.age.values;
		let sum = makeSum(values);

		let i = 0;
		let count = 0;
		while (count < sum / 2) {
			count += values[i];
			i += 1;
		}
		return i - 1;
	}

	function onResize() {
		cols = w < 575 ? 1 : window.getComputedStyle(grid).getPropertyValue("grid-template-columns").split(" ").length;
	}

  afterNavigate(() => {
    console.log('navigated');
    selected = []
    for (let pair of $page.url.searchParams.entries()) {
      let variable = vars.find(d => d.key == pair[0]);
      if (variable) {
        let category = variable.cats.find(d => d.code == pair[1]);
        if (category) {
          selected.push({topic: variable.label, key: variable.key, ...category});
        }
      }
    }
    if (selected[0]) {
      loadData();
    } else {
      data.selected = dataAll;
      sum.selected = sumAll;
    }
  });

	$: w && onResize();
</script>

<svelte:head>
  <title>Census Key Population Explorer</title>
  <meta name="description" content="">
  <meta property="og:title" content="Census Key Population Explorer" />
	<meta property="og:type" content="website" />
	<meta property="og:url" content="{assets}/" />
	<meta property="og:image:type" content="image/jpeg" />
	<meta property="og:description" content="" />
	<meta name="description" content="" />
</svelte:head>

<Section column="wide">

  <h1 class="mtl">Key population explorer</h1>
  
  <p>Select one or more identity characteristics to define a population group to compare with the whole population of England and Wales. For example, see <a href="?religion=7&cob=1-5">people of Sikh ethnicity born in the UK</a> or <a href="?age=65-90&cob=6">people aged 65+ born in Ireland</a>.</p>
  
  <select bind:value={active} disabled={!ops[0]}>
    <option value={null}>{!ops[0] ? 'No more topics available' : selected[0] ? 'Select another topic' : 'Select a topic'}</option>
    {#each ops as op, i}
    <option value={op}>{capitalise(op.label)}</option>
    {/each}
  </select>
  
  {#if active}
  <select bind:value={active_cats[active.label]}>
    {#each active.cats as cat}
    <option value={cat}>{@html cat.indent ? Array.from({length: cat.indent - 1}, v => spacer).join('') + arrow : ''}{capitalise(cat.label)}</option>
    {/each}
  </select>
  <button class="btn" on:mouseup={() => doSelect(active.label)}>
    Add
  </button>
  {/if}
  
  {#if selected[0]}
  <br/>
  {#each selected as item, i}
  {#if status == 'loading' && i == selected.length - 1}
  <div class="chip chip-pending">
    <span>{capitalise(item.topic)}: {capitalise(item.label)}</span>
    <div class="loader"/>
  </div>
  {:else}
  <div class="chip" class:chip-inactive={i >= varcount}>
    <span>{capitalise(item.topic)}: {capitalise(item.label)}</span>
    <button class="btn-pill" on:click="{() => unSelect(item.topic)}"/>
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
    Economic indicators (employment, social status etc) not available for ages 0 to 15.
    {/if}
  </div>
  {/if}
  
  {#if data.all && data.selected && sum.all && sum.selected >= 0}
  <div id="grid" class="grid mt" bind:clientWidth={w}>
    <div style="grid-column: span {cols};">
      <h3>Demographics</h3>
    </div>
    <div>
      <span class="text-label">Population</span><br/>
      {#if sum.selected == 0}
      <span class="muted">{texts.nodata}</span>
      {:else}
      <span class="inline text-big">{Math.round((sum.selected / sum.all) * 100) > 0 ? Math.round((sum.selected / sum.all) * 100) : '<1'}%</span>
      <span class="inline condensed text-small">of people in<br/>England and Wales</span>
      <div class="text-small muted">{sum.selected.toLocaleString()} of {sum.all.toLocaleString()} people</div>
      {/if}
    </div>
    <div>
      <span class="text-label">Median Age</span><br/>
      {#if isNA(data.selected.residents.age.values)}
      <span class="muted">{texts.nodata}</span>
      {:else}
      <span class="inline text-big">{getMedianAge(data.selected)}</span>
      <span class="inline text-small">years</span>
      {#if sum.all != sum.selected}
      <div class="text-small muted">vs {getMedianAge(data.all)} years for whole population</div>
      {/if}
      {/if}
    </div>
    <div>
      <span class="text-label">Age profile</span><br/>
      {#if isNA(data.selected.residents.age.values)}
      <span class="muted">{texts.nodata}</span>
      {:else}
      <div class="chart" style="height: 100px;">
        <ColChart data="{data.selected && makeData(['residents','age'])}" zKey="{sum.all != sum.selected ? 'z' : null}"/>
      </div>
      {#if sum.all != sum.selected}
      <div class="text-small muted"><li class="line"></li> {texts.comparison}</div>
      {/if}
      {/if}
    </div>
    <div style="grid-column: span {cols};">
      <h3>Population by area</h3>
    </div>
    <div id="map" style="grid-column: span {cols >= 2 ? 2 : 1};">
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
            bind:hovered={hovered}
            tooltip={true}
            type="fill"
            paint={{
              "fill-color": [
                "case",
                ["!=", ["feature-state", "color"], null],
                ["feature-state", "color"],
                "rgba(255, 255, 255, 0)",
              ],
              "fill-opacity": 0.8
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
    <div>
      <span class="text-label">% of population by local authority</span><br/>
      <div class="chart" style="height: 40px;">
        {#if data.geoBreaks && data.geoPerc}
        <SpineChart ticks={data.geoBreaks} data={hovered && data.geoPerc.find(d => d.code == hovered) ? [{x: data.geoPerc.find(d => d.code == hovered).value}] : []} colors={data.geoBreaks[1] == 100 ? [colors.seq[4]] : colors.seq}/>
        {/if}
      </div>
    </div>
    <div>
      <span class="text-label">Areas with highest %</span><br/>
      {#if data.geoPerc && selected[0]}
      <table class="table-rank text-small">
        <tbody>
          {#each [...data.geoPerc].sort((a, b) => b.value - a.value).slice(0, 5) as item, i}
          <tr>
            <td class="w30">{i + 1}.</td>
            <td>{item.name}</td>
            <td class="text-right">{item.value.toFixed(1)}%</td>
          </tr>
          {/each}
        </tbody>
      </table>
      {:else}
      <span class="muted">Make a selection to see ranking.</span>
      {/if}
    </div>
    <div>
      <span class="text-label">Areas with lowest %</span><br/>
      {#if data.geoPerc && selected[0]}
      <table class="table-rank text-small">
        <tbody>
          {#each data.geoPerc.filter(d => d.value != null).sort((a, b) => b.value - a.value).slice(-5) as item, i}
          <tr>
            <td class="w30">{data.geoPerc.length + i - 4}.</td>
            <td>{item.name}</td>
            <td class="text-right">{item.value.toFixed(1)}%</td>
          </tr>
          {/each}
        </tbody>
      </table>
      {:else}
      <span class="muted">Make a selection to see ranking.</span>
      {/if}
    </div>
    <div style="grid-column: span {cols};">
      <h3>Key indicators</h3>
    </div>
    <div>
      <span class="text-label">General health</span><br/>
      {#if isNA(data.selected.residents.health.values)}
      <span class="muted">{texts.nodata}</span>
      {:else}
      <StackedBarChart label={texts.comparison} data="{data.selected && makeData(['residents', 'health'])}" zKey="{sum.all != sum.selected ? 'z' : null}"/>
      {/if}
    </div>
    <div>
      <span class="text-label">Marital status</span><br/>
      {#if isNA(data.selected.residents.marital.values)}
      <span class="muted">{texts.nodata}</span>
      {:else}
      <StackedBarChart label={texts.comparison} data="{data.selected && makeData(['residents', 'marital'])}" zKey="{sum.all != sum.selected ? 'z' : null}"/>
      {/if}
    </div>
    <div>
      <span class="text-label">Social grade</span><br/>
      {#if isNA(data.selected.residents.grade.values)}
      <span class="muted">{texts.nodata}</span>
      {:else}
      <StackedBarChart label={texts.comparison} data="{data.selected && makeData(['residents', 'grade'])}" zKey="{sum.all != sum.selected ? 'z' : null}"/>
      {/if}
    </div>
    <div>
      <span class="text-label">Economic activity</span><br/>
      {#if isNA(data.selected.residents.economic.values)}
      <span class="muted">{texts.nodata}</span>
      {:else}
      <StackedBarChart label={texts.comparison} data="{data.selected && makeData(['residents', 'economic'])}" zKey="{sum.all != sum.selected ? 'z' : null}"/>
      {/if}
    </div>
    <div>
      <span class="text-label">Distance to work (km)</span><br/>
      {#if isNA(data.selected.residents.distance.values)}
      <span class="muted">{texts.nodata}</span>
      {:else}
      <div class="chart" style="height: 100px;">
        <ColChart data="{data.selected && makeData(['residents','distance'])}" zKey="{sum.all != sum.selected ? 'z' : null}"/>
      </div>
      {#if sum.all != sum.selected}
      <div class="text-small muted"><li class="line"></li> vs whole population</div>
      {/if}
      <div class="text-small muted">Excludes home workers and other circumstances</div>
      {/if}
    </div>
    <div>
      <span class="text-label">Mode of travel to work</span><br/>
      {#if isNA(data.selected.residents.travel.values)}
      <span class="muted">{texts.nodata}</span>
      {:else}
      <StackedBarChart label={texts.comparison} data="{data.selected && makeData(['residents', 'travel'])}" zKey="{sum.all != sum.selected ? 'z' : null}"/>
      {/if}
    </div>
    <div>
      <span class="text-label">Type of housing</span><br/>
      {#if isNA(data.selected.households.housing.values)}
      <span class="muted">{texts.nodata}</span>
      {:else}
      <StackedBarChart label={texts.comparison} data="{data.selected && makeData(['households', 'housing'])}" zKey="{sum.all != sum.selected ? 'z' : null}"/>
      {/if}
    </div>
    <div>
      <span class="text-label">Tenure of housing</span><br/>
      {#if isNA(data.selected.households.tenure.values)}
      <span class="muted">{texts.nodata}</span>
      {:else}
      <StackedBarChart label={texts.comparison} data="{data.selected && makeData(['households', 'tenure'])}" zKey="{sum.all != sum.selected ? 'z' : null}"/>
      {/if}
    </div>
  </div>
  {/if}  
</Section>

<style>
	a {
		color: #206095;
		text-decoration: underline;
	}
	a:hover {
		color: rgb(0, 60, 87);
	}
	img {
		width: 200px;
	}
  h3 {
    margin: 0;
  }
	.btn {
		padding: 2px 4px;
		margin: 0;
		border: 2px solid #206095;
		cursor: pointer;
		color: #206095;
		background-color: lightgrey;
	}
	.btn-active {
		color: white;
		background-color: #206095;
	}
	.text-big {
		font-size: 2.2em;
		font-weight: bold;
	}
	.text-med {
		font-size: 1.8em;
		font-weight: bold;
		line-height: 1.7;
	}
	.text-small {
		font-size: 0.85em;
	}
	.text-label {
		font-weight: bold;
	}
	.muted {
		color: grey;
	}
	.capitalise {
		text-transform: capitalize;
	}
	.line {
		background-color: #27A0CC;
		width: 25px;
  	height: 2px;
  	display: inline-block;
		margin-bottom: 3px;
	}
	.text-right {
		text-align: right;
	}
	.float-right {
		float: right;
	}
	.inline {
		display: inline-block;
	}
	.condensed {
		line-height: 1.1em;
	}
	.mt {
		margin-top: 20px;
	}
	.mtl {
		margin-top: 50px;
	}
	.mbs {
		margin-bottom: 10px;
	}
	.grid {
		display: grid;
		width: 100%;
		grid-gap: 10px;
		grid-template-columns: repeat(auto-fit, minmax(min(280px, 100%), 1fr));
		justify-content: stretch;
		grid-auto-flow: row dense;
	}
	#grid {
		grid-gap: 20px !important;
	}
	.chart {
		position: relative;
		width: 100%;
	}
	#map {
		grid-row: span 3;
		min-height: 400px;
	}

	h1 {
		font-weight: bold;
	}
	select {
		appearance: none;
		background: white url("https://ons-design-system.netlify.app/img/icons--chevron-down.svg") padding-box no-repeat;
		background-position: calc(100% - 10px) 50%;
		background-size: 18px;
		border: 1.5px solid rgb(34, 34, 34);
		outline: 1.5px solid white;
		border-radius: 3px;
		padding: 7px 36px 7px 9px;
		margin-top: 12px;
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
	}
  .table-rank {
    width: 100%;
  }
  .w30 {
    width: 30px;
  }
	.chip {
		display: inline-flex;
		vertical-align: middle;
		background-color: rgb(231, 243, 236);
		font-size: 0.9rem;
		border: 1.5px solid #0f8243;
		border-radius: 20px;
		padding: 5px;
		margin: 0 5px 5px 0;
	}
	.chip-inactive {
		background-color: rgb(250, 230, 232);
		border-color: #d0021b;
	}
	.chip-pending {
		background-color: #fef4ee;
		border-color: #ff803b;
	}
	.chip span {
		padding: 0 10px;
	}
	.chip button {
		background: #0f8243 url("https://bothness.github.io/geo-draw/img/x-close.svg") no-repeat center;
		margin: 0;
		width: 20px;
		height: 20px;
		border: none;
		border-radius: 50%;
	}
	.chip-inactive button {
		background-color: #d0021b;
	}
	.loader {
		box-sizing: border-box;
		border: 5px solid rgba(0,0,0,0.2);
		border-radius: 50%;
		border-top: 5px solid #ff803b;
		border-right: 5px solid #ff803b;
		width: 20px;
		height: 20px;
		-webkit-animation: spin 2s linear infinite; /* Safari */
		animation: spin .75s linear infinite;
	}
	/* Safari */
	@-webkit-keyframes spin {
		0% { -webkit-transform: rotate(0deg); }
		100% { -webkit-transform: rotate(360deg); }
	}
	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}
</style>
<script context="module">
	export const prerender = false;

  import { getTopo, getData, getGeo } from "$lib/utils";
	import { ladBounds, datasets, newDatasets, colors, populationBases } from "$lib/config";
	import { base, assets } from "$app/paths";

	export async function load({ fetch }) {
    let geojson = await getTopo(assets + ladBounds.url, ladBounds.layer, fetch);

    let geoLookup = {};
    geojson.features.forEach(d => geoLookup[d.properties[ladBounds.code]] = d.properties[ladBounds.name]);

    let json = await getData(newDatasets, [], fetch);
    let sumAll = makeSum(json.data.residents.health_in_general.values);  // WAS: makeSum(json.data.residents.health.values)
		let dataAll = json.data;

    let geoAll = await getGeo([], fetch);
    let geoPerc = [];

		let geoCodes = Object.keys(geoAll);

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
  import { page } from '$app/stores';
  import { goto, afterNavigate } from '$app/navigation';
  import { setContext } from "svelte";
	import { ckmeans } from "simple-statistics";
	import { getColor, capitalise, makeSum, isNA, suffixer, changeClass, changeStr } from "$lib/utils";
	import { themes, vars as vars_, newVars, codes, mapStyle, texts, arrow, spacer } from "$lib/config";
	import Titleblock from "$lib/layout/Titleblock.svelte";
	import Headline from "$lib/layout/partial/Headline.svelte";
	import ProfileChart from "$lib/chart/ProfileChart.svelte";
	import BreaksChart from "$lib/chart/BreaksChart.svelte";
	import BarChart from "$lib/chart/BarChart.svelte";
	import GroupChart from "$lib/chart/GroupChart.svelte";
	import StackChart from "$lib/chart/StackChart.svelte";
	import Table from "$lib/chart/Table.svelte";
	import Map from "$lib/map/Map.svelte";
	import MapSource from "$lib/map/MapSource.svelte";
	import MapLayer from "$lib/map/MapLayer.svelte";
	import Content from "$lib/layout/Content.svelte";
	import Tiles from "$lib/layout/Tiles.svelte";
	import Tile from "$lib/layout/partial/Tile.svelte";
	import Em from "$lib/ui/Em.svelte";

  export let geojson, geoLookup, sumAll, dataAll, geoAll, geoCodes, geoPerc;

	let vars = vars_.concat(newVars);

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
	vars.forEach(d => {
		active_cats[d.label] = d.cats[0];
	});
	let hovered = null;
	let status = "success"; // Options: success, fail, loading
	let u16 = false; // If age selection is 0-15 some tables won't show data
	let varcount = 0; // Number of variables successfully loaded
	let chart_type = BarChart;

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
    goto(`${base}?${selected.map(d => `${d.key}=${d.code}`).join('&')}`, {noscroll: true});
		active = null;
	}
	
	function unSelect(topic) {
		selected = selected.filter(d => d.topic != topic);
		goto(`${base}?${selected.map(d => `${d.key}=${d.code}`).join('&')}`, {noscroll: true});
	}

	function loadData() {
		status = 'loading';

		if (selected && selected.map(d => d.code).includes('0-15')) {
			u16 = true;
		} else {
			u16 = false;
		}

		getData(newDatasets, selected)
		.then(json => {
			if (json.data.residents.sex.values) {  // 	WAS: if (json.data.residents.age.values) {
				sum.selected = makeSum(json.data.residents.health_in_general.values);  // WAS: sum.selected = makeSum(json.data.residents.health.values);
				data.selected = json.data;

				getGeo(selected)
				.then(geoData => {
					let array = [];
					let groups = null;

					if (true) {
						data.geoCodes.forEach(code => {
							array.push({code: code, name: data.geoLookup[code], value: geoData[code] ? (geoData[code] / data.geoAll[code]) * 100 : null});
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

	function makeDataNew(props) {
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
			if (sum.selected != sum.all) arr.push({group: "This group", category: label, count: valSelected});
			arr.push({group: "Whole population", category: label, count: valAll});
		});

		arr.forEach((d, i) => {
			if (sum.selected != sum.all && i % 2 == 0) {
				d.value = (d.count / sumSelected) * 100;
			} else {
				d.value = (d.count / sumAll) * 100;
			}
		});

		return arr;
	}

	function makeDataNewNew(props) {
		let group = props[0];
		let dataset = props[1];
		let valsSelected = data.selected[group][dataset];
		let valsAll = data.all[group][dataset];
		let result = [];
		for (let code of codes[dataset]) {
			result.push({group: "This group", category: code.label, value: valsSelected.values[code.cells[0]] / makeSum(valsSelected.values) * 100});
			result.push({group: "Whole population", category: code.label, value: valsAll.values[code.cells[0]] / makeSum(valsAll.values) * 100});
		}
		return result;
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

	function refreshData() {
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
    loadData();
	}

	afterNavigate(refreshData); // Refresh data when user navigates
</script>

<svelte:head>
  <title>Census Population Group Profiles</title>
  <meta name="description" content="">
  <meta property="og:title" content="Census Population Group Profiles" />
	<meta property="og:type" content="website" />
	<meta property="og:url" content="{assets}/" />
	<meta property="og:image:type" content="image/jpeg" />
	<meta property="og:description" content="" />
	<meta name="description" content="" />
</svelte:head>

<Titleblock
	background="none"
	breadcrumb="{[{label: 'Census', url: '/census'}, {label: 'Population Group Profiles'}]}">
	<Headline>Population Group Profiles</Headline>
	<p class="subtitle">Select one or more identity characteristics to define a population group to compare with the whole population of England and Wales. For example, see <a href="?religion=7&cob=1-5">people of Sikh ethnicity born in the UK</a> or <a href="?age=65-90&cob=6">people aged 65+ born in Ireland</a>.</p>
	<div slot="meta" class="wrapper">
	<select bind:value={active} disabled={!ops[0]}>
    <option value={null}>{!ops[0] ? 'No more topics available' : selected[0] ? 'Select another characteristic' : 'Select a characteristic'}</option>
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
		<div class="chip-loader"/>
	</div>
	{:else}
	<div class="chip" class:chip-inactive={i >= varcount}>
		<span>{capitalise(item.topic)}: {capitalise(item.label)}</span>
		<button on:click="{() => unSelect(item.topic)}"/>
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
	</div>
</Titleblock>

<Content>
	<Tiles title="Demographics">
		<Tile title="Population">
			{#if sum.selected == 0}
			<div class="num-desc">{texts.nodata}</div>
			{:else}
			<div class="num-big">{Math.round((sum.selected / sum.all) * 100) > 0 ? Math.round((sum.selected / sum.all) * 100) : '<1'}%</div>
			<div class="num-suffix">of people in England and Wales</div>
			<div class="num-desc"><Em color="lightgrey">{sum.selected.toLocaleString()}</Em> of {sum.all.toLocaleString()} people</div>
			{/if}
		</Tile>
		<!-- <Tile title="Average (median) age">
			{#if isNA(data.selected.residents.age.values)}
			<div class="num-desc">{texts.nodata}</div>
			{:else}
			<div class="num-big">{getMedianAge(data.selected)}</div>
			<div class="num-suffix">years</div>
			{#if sum.all != sum.selected}
      <div class="num-desc"><Em color="lightgrey">{getMedianAge(data.all)} years</Em> for whole population</div>
      {/if}
			{/if}
		</Tile> -->
		<Tile title="Age profile">
			{#if isNA(data.selected.residents.resident_age_18b.values)}
      <span class="num-desc">{texts.nodata}</span>
      {:else}
			<ProfileChart
					data="{data.selected && makeDataNew(['residents', 'resident_age_18b'])}"
					zKey="group"
					/>
			{/if}
		</Tile>
	</Tiles>

	<Tiles title="Population by area">
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
			{#if data.geoBreaks && data.geoPerc}
			<div style:height="38px" style:width="100%">
				<BreaksChart breaks={data.geoBreaks} hovered={hovered && data.geoPerc.find(d => d.code == hovered) ? data.geoPerc.find(d => d.code == hovered).value : null} colors={data.geoBreaks[1] == 100 ? [colors.seq[4]] : colors.seq}/>
			</div>
			{/if}
		</Tile>
		<Tile title="Areas with highest %">
			{#if data.geoPerc && selected[0]}
			<Table data={[...data.geoPerc].sort((a, b) => b.value - a.value).slice(0, 5)}/>
			{:else}
			<span class="muted">Make a selection to see rankings.</span>
			{/if}
		</Tile>
		<Tile title="Areas with lowest %">
			{#if data.geoPerc && selected[0]}
			<Table data={data.geoPerc.filter(d => d.value != null).sort((a, b) => b.value - a.value).slice(-5)} offset={data.geoPerc.filter(d => d.value != null).length - 4}/>
			{:else}
			<span class="muted">Make a selection to see rankings.</span>
			{/if}
		</Tile>
	</Tiles>

	<Tiles title="Key indicators">
		<span slot="meta" style:margin-left="10px">
			<strong>Chart type:</strong>
			<label><input type=radio bind:group={chart_type} name="chart-type" value={BarChart}>Comparison marker</label>
			<label><input type=radio bind:group={chart_type} name="chart-type" value={GroupChart}>Grouped bar</label>
			<label><input type=radio bind:group={chart_type} name="chart-type" value={StackChart}>Stacked bar</label>
		</span>
		<Tile title="General health">
			{#if !("health" in data.selected.residents) || isNA(data.selected.residents.health.values)}
      <span class="num-desc">{texts.nodata}</span>
      {:else}
			<svelte:component this={chart_type} data="{data.selected && makeDataNew(['residents', 'health'])}"/>
			{/if}
		</Tile>
		{#each (console.log(newDatasets), newDatasets[0].tables.slice(1)) as table}
			<Tile title="{table.key}">
				<!-- FIXME: check for missing data -->
				{#if !(table.code in data.selected.residents) || data.selected.residents[table.code].values == null}
				<span class="num-desc">{texts.nodata}</span>
				{:else}
				<svelte:component this={chart_type} data="{
							data.selected && makeDataNewNew(['residents', table.code])
						}"/>
				{/if}
				<span class="num-desc">Percentage of {populationBases[table.code]}</span>
			</Tile>
		{/each}
		<!-- <Tile title="Marital status">
			{#if isNA(data.selected.residents.marital.values)}
      <span class="num-desc">{texts.nodata}</span>
      {:else}
			<svelte:component this={chart_type} data="{data.selected && makeDataNew(['residents', 'marital'])}"/>
			{/if}
		</Tile> -->
		<!-- <Tile title="Social grade">
			{#if isNA(data.selected.residents.grade.values)}
      <span class="num-desc">{texts.nodata}</span>
      {:else}
			<svelte:component this={chart_type} data="{data.selected && makeDataNew(['residents', 'grade'])}"/>
			{/if}
		</Tile> -->
		<!-- <Tile title="Economic activity">
			{#if isNA(data.selected.residents.economic.values)}
      <span class="num-desc">{texts.nodata}</span>
      {:else}
			<svelte:component this={chart_type} data="{data.selected && makeDataNew(['residents', 'economic'])}"/>
			{/if}
		</Tile>
		<Tile title="Distance to work (km)">
			{#if isNA(data.selected.residents.distance.values)}
      <span class="num-desc">{texts.nodata}</span>
      {:else}
			<svelte:component this={chart_type} data="{data.selected && makeDataNew(['residents', 'distance'])}"/>
			{/if}
		</Tile>
		<Tile title="Mode of travel to work">
			{#if isNA(data.selected.residents.travel.values)}
      <span class="num-desc">{texts.nodata}</span>
      {:else}
			<svelte:component this={chart_type} data="{data.selected && makeDataNew(['residents', 'travel'])}"/>
			{/if}
		</Tile>
		<Tile title="Type of housing">
			{#if isNA(data.selected.households.housing.values)}
      <span class="num-desc">{texts.nodata}</span>
      {:else}
			<svelte:component this={chart_type} data="{data.selected && makeDataNew(['households', 'housing'])}"/>
			{/if}
		</Tile>
		<Tile title="Tenure of housing">
			{#if isNA(data.selected.households.tenure.values)}
      <span class="num-desc">{texts.nodata}</span>
      {:else}
			<svelte:component this={chart_type} data="{data.selected && makeDataNew(['households', 'tenure'])}"/>
			{/if}
		</Tile> -->
	</Tiles>
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
		background: white url("https://ons-design-system.netlify.app/img/icons--chevron-down.svg") padding-box no-repeat;
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
		color: #666;
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
	.chip-loader {
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
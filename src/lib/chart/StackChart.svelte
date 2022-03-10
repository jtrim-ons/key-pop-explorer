<script>
	export let data;
	export let xKey = "value";
	export let yKey = "category";
	export let zKey = "group";
	export let formatTick = d => Math.round(d);
	export let suffix = "%";
	export let barHeight = 75;
	export let colors = ['#206095', '#A8BD3A', '#003C57', '#27A0CC', '#118C7B', '#F66068', '#746CB1', '#22D0B6', 'lightgrey'];
	
	function stackData(data, key) {
		let data_indexed = {};
		let offset = {};
		
		for (const d of data) {
			if (!data_indexed[d[key]]) {
				data_indexed[d[key]] = {
					label: d[key],
					values: []
				};
				offset[d[key]] = 0;
			}
			data_indexed[d[key]].values.push({...d, offset: offset[d[key]]});
			offset[d[key]] += d[xKey];
		}
		
		let data_stacked = [];
		for (const key in data_indexed) {
			data_stacked.push(data_indexed[key]);
		}
		
		return data_stacked;
	}
	
	$: yDomain = data.map(d => d[yKey]).filter((v, i, a) => a.indexOf(v) === i);
	$: zDomain = data.map(d => d[zKey]).filter((v, i, a) => a.indexOf(v) === i);
	$: xDomain = [0, data.filter(d => d[zKey] == zDomain[0]).map(d => d[xKey]).reduce((a, b) => a + b, 0)];
	
	$: xScale = (value) => (value / xDomain[1]) * 100;
	$: yScale = (value) => colors[yDomain.indexOf(value) % yDomain.length];
	
	$: data_stacked = stackData(data, zKey);
	$: data_grouped = stackData(data, yKey);
</script>

{#each data_stacked as stack, i}
	<div class="bar-group" style:height="{i == 0 ? barHeight : barHeight / 2}px">
	{#each stack.values as d}
		<div class="bar" style:left="{xScale(d.offset)}%" style:width="{xScale(d[xKey])}%" style:background-color="{yScale(d[yKey])}"/>
	{/each}
  {#if i != 0}<div class="legend overlay brackets">{stack.label} comparison</div>{/if}
	</div>
{/each}

<table class="legend">
	<tbody>
		{#each data_grouped as group}
		<tr>
			<td>
				<div class="legend-vis" style:background-color={yScale(group.label)}/>
				{group.label}
			</td>
			{#each group.values as d, i}
			<td class="cell-right {i == 0 ? 'bold' : 'brackets'}">{formatTick(d[xKey])}{suffix}</td>
			{/each}
		</tr>
		{/each}
	</tbody>
</table>

<style>
	.bold {
		font-weight: bold;
	}
	.brackets::before {
		content: "(";
	}
	.brackets::after {
		content: ")";
	}
	.bar-group {
		display: block;
		position: relative;
		width: 100%;
    margin: 0;
    padding: 0;
	}
	.bar-group > div {
		position: absolute;
		height: 100%;
		top: 0;
	}
  .legend {
    line-height: 1.3;
    font-size: 0.9rem;
  }
  .overlay {
    width: 100%;
    height: auto !important;
    background-color: rgba(255,255,255,0.7);
  }
	table.legend {
		width: 100%;
		border-spacing: 0;
		border-collapse: collapse;
		margin-top: 2px;
	}
	td {
		padding: 3px 0 0 0;
		margin: 0;
	}
	td.cell-right {
		text-align: right;
		width: 45px;
	}
	.legend-vis {
		display: inline-block;
		width: 1rem;
		height: 1rem;
		transform: translate(0,3px);
	}
</style>
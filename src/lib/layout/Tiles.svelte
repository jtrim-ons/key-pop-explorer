
<script>
  import { onMount, setContext } from "svelte";
	import { writable } from 'svelte/store';

  export let title = null;
  export let colwidth = 280;
  export let gridgap = 16;

  let w;

  const cols = writable(3);

  $: columns = w ? Math.floor((w + gridgap) / (colwidth + gridgap)) : 3;
  $: cols.set(columns);

  setContext("tiles", { cols });
</script>

<div class="tiles">
  {#if title}
	<h2 id="topics">{title}</h2>
  <slot name="meta"/>
  {/if}
  <div bind:clientWidth={w}
    class="tiles-grid margin-bottom"
    style:grid-template-columns="repeat(auto-fit, minmax(min({colwidth}px, 100%), 1fr))"
    style:grid-gap="{gridgap}px">
    <slot/>
  </div>
</div>

<style>
  #topics {
    display: inline-block;
  }
  .tiles-grid {
		display: grid;
		width: 100%;
		justify-content: stretch;
		grid-auto-flow: row dense;
    margin: 8px 0;
	}
</style>
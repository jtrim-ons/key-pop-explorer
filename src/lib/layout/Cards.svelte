
<script>
  export let title = null;
</script>

<div class="tiles">
  {#if title}
	<h2 id="topics">{title}</h2>
  {/if}
  <div class="tiles-grid margin-bottom">
    <slot/>
  </div>
</div>

<style>
  .tiles-grid {
		display: grid;
		width: 100%;
		grid-gap: 16px;
		grid-template-columns: repeat(auto-fit, minmax(min(280px, 100%), 1fr));
		justify-content: stretch;
		grid-auto-flow: row dense;
    margin: 8px 0;
	}
</style>
<script>
  export let options = [];
  export let clickCallback = clicked;
  export let columnTitle = "column title";
  export let labeller = (option) => option.label;
  export let selected = null;
  $: console.log(options);

  function clicked(option) {
    console.log("clicked", option);
    selected = option;
  }
</script>

<div class="column">
  <h5 class="column-title">{columnTitle}</h5>
  {#each options as option}
    <button
      class:selected={option === selected}
      on:click={() => clickCallback(option)}
    >
      {labeller(option)}
      <span class="right-chevron">&gt;</span>
    </button>
  {/each}
</div>

<style>
  .column {
    width: 33.33%;
  }
  button {
    display: block;
    width: 100%;
    background-color: white;
    text-align: left;
    border: none;
    border-bottom: 1px solid #ccc;
    padding: 3px;
  }
  button.selected {
    background-color: steelblue;
    color: white;
  }
  .column-title {
  }
  .right-chevron {
    float: right;
  }
</style>

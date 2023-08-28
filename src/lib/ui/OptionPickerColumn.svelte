<script>
  export let options = [];
  export let clickCallback = clicked;
  export let removeCatCallback = clicked;
  export let checkIfOptionSelected = () => {};
  export let globalSelectedCategories = [];
  export let columnTitle = "column title";
  export let labeller = (option) => option.label;
  export let selected = null;
  export let hasChildren = true;
  $: console.log(options);
  $: console.log(globalSelectedCategories);

  function clicked(option) {
    console.log("clicked", option);
  }

  function checkIfAnySelected(option, globalSelectedCategories) {
    for (let c of globalSelectedCategories) {
      if (c.topic === option.label) {
        return c.label;
      }
    }
    return false;
  }
</script>

<div class="column">
  <h5 class="column-title">{columnTitle}</h5>
  {#if hasChildren}
    {#each options as option}
      <button
        class:plain-button={true}
        class:selected={option === selected}
        on:click={() => {
          selected = option;
          clickCallback(option);
        }}
      >
        {labeller(option)}
        <span class="right-chevron">&rsaquo;</span>
        {#if checkIfAnySelected(option, globalSelectedCategories)}
          <br />
          <div>
            Currently selected: {checkIfAnySelected(
              option,
              globalSelectedCategories
            )}
          </div>
        {/if}
      </button>
    {/each}
  {:else}
    {#each options as option, i}
      <p>
        <input
          type="radio"
          id={"category-option-" + i}
          name="selected-category"
          checked={checkIfOptionSelected(option, globalSelectedCategories)}
          on:click={() => clickCallback(option)}
        /> <label for={"category-option-" + i}>{labeller(option)}</label>
        {#if checkIfOptionSelected(option, globalSelectedCategories)}
          <button on:click={() => removeCatCallback(option)} style="float:right"
            >Remove</button
          >
        {/if}
      </p>
    {/each}
  {/if}
</div>

<style>
  .column {
    width: 33.33%;
    padding-right: 9px;
  }
  button.plain-button {
    display: block;
    width: 100%;
    background-color: white;
    text-align: left;
    border: none;
    border-bottom: 1px solid #ccc;
    padding: 6px;
    font-size: 16px;
  }
  button.selected {
    background-color: steelblue;
    color: white;
  }
  button div {
    color: #555;
    margin: 0;
    padding: 0;
    margin-left: 9px;
    font-size: 12px;
  }
  button.selected div {
    color: white;
  }
  .column-title {
    font-size: 20px;
  }
  .right-chevron {
    float: right;
  }
  p {
    padding: 0;
    margin: 0;
    margin-bottom: 3px;
  }
  input,
  label {
    cursor: pointer;
  }
</style>

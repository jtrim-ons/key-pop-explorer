<script>
  export let options = [];
  export let clickCallback = clicked;
  export let removeCatCallback = clicked;
  export let backButtonCallback = null;
  export let globalSelectedCategories = [];
  export let columnTitle = "column title";
  export let labeller = (option) => option.label;
  export let selected = null;
  export let hasChildren = true;
  export let disabled = false;
  export let hiddenOnMobile = false;
  export let currentVar = null;

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

  function checkIfOptionSelected(cat, globalSelectedCategories) {
    for (const s of globalSelectedCategories) {
      if (s.var === cat.var && s.code === cat.code) {
        return true;
      }
    }
    return false;
  }
</script>

<div class="column" class:hidden-first-column={hiddenOnMobile}>
  {#if backButtonCallback != null}
    <button class="hidden-on-desktop" on:click={backButtonCallback}>Back</button
    >
  {/if}
  {#if hasChildren}
    <h5 class="column-title">{columnTitle}</h5>

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
    <div class="title-container">
      <h5 class="column-title">{columnTitle}</h5>
      {#if checkIfAnySelected(currentVar, globalSelectedCategories)}
        <button
          on:click={() => removeCatCallback(currentVar)}
          style="float:right"
          {disabled}>Clear selection</button
        >
      {/if}
    </div>

    {#each options as option, i}
      <p>
        <input
          type="radio"
          id={"category-option-" + i}
          name="selected-category"
          checked={checkIfOptionSelected(option, globalSelectedCategories)}
          {disabled}
          on:click={() => clickCallback(option)}
        /> <label for={"category-option-" + i}>{labeller(option)}</label>
      </p>
    {/each}
  {/if}

  <slot />
</div>

<style>
  .hidden-first-column {
    display: none;
  }

  .title-container {
    display: flex;
  }

  .column {
    width: 100%;
  }
  @media (min-width: 800px) {
    .column {
      width: 50%;
      padding-right: 9px;
    }
    .hidden-first-column {
      display: initial;
    }
    .hidden-on-desktop {
      display: none;
    }
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
  button.plain-button:last-child {
    border-bottom: none;
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

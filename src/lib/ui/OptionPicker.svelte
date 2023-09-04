<script>
  import OptionPickerColumn from "./OptionPickerColumn.svelte";

  export let options = [];
  export let clickCallback = selectCat;
  export let removeCatCallback = removeCat;
  export let globalSelectedCategories = [];
  export let disabled = false;

  function selectCat(variable, cat) {
    console.log(variable, cat);
  }

  function removeCat(variable, cat) {
    console.log(variable, cat);
  }

  let selectedColumn = null;
  let selectedClassification = null;
  let selectedCategory = null;
</script>

<div class="container">
  <OptionPickerColumn
    columnTitle="Select a variable"
    bind:selected={selectedColumn}
    clickCallback={() => {
      selectedClassification = null;
    }}
    {options}
    {globalSelectedCategories}
  />
  {#if selectedColumn != null}
    <OptionPickerColumn
      columnTitle="Select a classification"
      labeller={(option) => `${option.cats.length + " categories"}`}
      bind:selected={selectedClassification}
      options={selectedColumn.vars}
    />
    {#if selectedClassification != null}
      <OptionPickerColumn
        columnTitle="Select a category"
        bind:selected={selectedCategory}
        options={selectedClassification.cats}
        clickCallback={(category) =>
          clickCallback(selectedClassification, category)}
        removeCatCallback={(category) =>
          removeCatCallback(selectedClassification, category)}
        hasChildren={false}
        {globalSelectedCategories}
        {disabled}
      />
    {/if}
  {/if}
</div>

{#if false}
  <div>
    {#each options as option}
      <details>
        <summary
          style="border: 1px solid lightsteelblue; padding: 3px; width: 300px"
          >{option.label}<span class="chevron-right">&gt;</span></summary
        >
        {#each option.vars as v}
          <details style="margin-left: 21px">
            <summary
              >{v.cats.length} categories<span class="chevron-right">&gt;</span
              ></summary
            >
            <div style="margin-left: 21px">
              {#each v.cats as c}
                <div>
                  <button on:click={() => clickCallback(v, c)}
                    >+ {c.label}</button
                  >
                </div>
              {/each}
            </div>
          </details>
        {/each}
      </details>
    {/each}
  </div>
{/if}

<style>
  li {
    margin: 0;
    padding: 0;
  }

  .container {
    display: flex;
    flex-direction: column;
  }
  @media (min-width: 800px) {
    .container {
      flex-direction: row;
    }
  }

  .chevron-right {
    float: right;
  }
</style>

<script>
  import OptionPickerColumn from "./OptionPickerColumn.svelte";

  export let options = [];
  export let catCallback = selectCat;

  function selectCat(variable, cat) {
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
    {options}
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
      />
    {/if}
  {/if}
</div>

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
                <button on:click={() => catCallback(v, c)}>+ {c.label}</button>
              </div>
            {/each}
          </div>
        </details>
      {/each}
    </details>
  {/each}
</div>

<style>
  li {
    margin: 0;
    padding: 0;
  }

  .container {
    display: flex;
  }

  .chevron-right {
    float: right;
  }
</style>

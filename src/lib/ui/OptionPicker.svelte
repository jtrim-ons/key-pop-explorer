<script>
  export let options = [];
  export let catCallback = selectCat;

  function selectCat(variable, cat) {
    console.log(variable, cat);
  }
</script>

<div>
  {#each options as option}
    <details>
      <summary
        style="border: 1px solid lightsteelblue; padding: 3px; width: 300px"
        >{option.label} ></summary
      >
      {#each option.vars as v}
        <details style="margin-left: 21px">
          <summary>{v.cats.length} categories ></summary>
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
</style>

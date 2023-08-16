<script>
  import { xlink_attr } from "svelte/internal";

  export let options = [];
</script>

<div>
  <ol>
    {#each options as option}
      <li>{option.label}</li>
    {/each}
  </ol>
</div>

<style>
  li {
    margin: 0;
    padding: 0;
  }
</style>

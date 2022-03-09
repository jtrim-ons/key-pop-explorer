<script>
  let height;
</script>

<aside role="alert" class="warning" bind:clientHeight={height}>
  <div class="wrapper middle">
    <strong>WARNING! This is a prototype. Data is synthetic. It is NOT actual 2021 Census data.</strong>
  </div>
</aside>
<div class="spacer" style:height="{height}px"/>

<style>
  .warning {
    position: fixed;
    z-index: 100;
    top: 0;
    width: 100%;
    color: white;
    background-color: #bb3333;
    margin-bottom: 10px;
    padding: 8px 0;
    font-size: 1em;
  }
  .spacer {
    display: block;
  }
</style>

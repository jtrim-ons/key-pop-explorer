<script>
  import { getContext, setContext } from "svelte";

  export let id;
  export let type;
  export let url = null;
  export let props = {};
  export let data = null;
  export let layer = null;
  export let promoteId = null;
  export let minzoom = null;
  export let maxzoom = null;

  let loaded = false;

  const { getMap } = getContext("map");
  const map = getMap();

  setContext("source", {
    source: id,
    sourceLayer: layer,
  });

  if (map.getSource(id)) {
    map.removeSource(id);
  }

  function isSourceLoaded() {
    if (map.isSourceLoaded(id)) {
      loaded = true;
    } else {
      setTimeout(() => {
        isSourceLoaded();
      }, 500);
    }
  }

  function isMapLoaded() {
    if (map.isStyleLoaded(id)) {
      addSource();
      // Prevent map div from being tabbable
      if (
        document.querySelector("#map canvas") &&
        document.querySelector("#map canvas").tabIndex == "0"
      ) {
        document.querySelector("#map canvas").tabIndex = "-1";
      }
    } else {
      setTimeout(() => {
        isMapLoaded();
      }, 500);
    }
  }

  // Set optional source properties
  if (minzoom) {
    props.minzoom = minzoom;
  }
  if (maxzoom) {
    props.maxzoom = maxzoom;
  }
  if (layer && promoteId) {
    props.promoteId = {};
    props.promoteId[layer] = promoteId;
  } else if (promoteId) {
    props.promoteId = promoteId;
  }

  function addSource() {
    if (type == "geojson") {
      if (data) {
        map.addSource(id, {
          type: type,
          data: data,
          ...props,
        });
        isSourceLoaded();
      } else if (url) {
        map.addSource(id, {
          type: type,
          data: url,
          ...props,
        });
        isSourceLoaded();
      }
    } else if (type == "vector") {
      map.addSource(id, {
        type: type,
        tiles: [url],
        ...props,
      });
      isSourceLoaded();
    }
  }

  isMapLoaded();

  function setData() {
    map.getSource(id).setData(data);
  }

  $: loaded && data && setData();
</script>

{#if loaded}
  <slot />
{/if}

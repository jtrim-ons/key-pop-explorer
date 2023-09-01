<script>
  import { onMount, setContext } from "svelte";
  import mapbox from "mapbox-gl";

  export let map;
  export let id = "map";
  export let location = {
    bounds: [
      [-5.816, 49.864],
      [1.863, 55.872],
    ], // England & Wales
  };
  export let maxbounds = [
    [-13, 48],
    [5, 60],
  ];
  export let style =
    "https://bothness.github.io/ons-basemaps/data/style-omt.json";
  export let interactive = true;
  export let minzoom = 0;
  export let maxzoom = 10;
  export let zoom = null;
  export let scrollzoom = true;
  export let geolocate = true;
  export let zoomcontrol = true;

  let container;
  let options;

  setContext("map", {
    getMap: () => map,
  });

  if (location.bounds) {
    options = { bounds: location.bounds };
  } else if (location.lon && location.lat) {
    options = {
      center: [location.lon, location.lat],
    };
    if (location.zoom) options.zoom = location.zoom;
  }
  if (maxbounds) options.maxBounds = maxbounds;

  onMount(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/mapbox-gl@1.13.0/dist/mapbox-gl.css";

    link.onload = () => {
      map = new mapbox.Map({
        container,
        style: style,
        minZoom: minzoom,
        maxZoom: maxzoom,
        interactive: interactive,
        ...options,
      });

      if (zoomcontrol) {
        map.addControl(new mapbox.NavigationControl({ showCompass: false }));
      }
      if (!scrollzoom) {
        map.scrollZoom.disable();
      }
      if (geolocate) {
        map.addControl(new mapbox.GeolocateControl());
      }

      // Get initial zoom level
      map.on("load", () => {
        zoom = map.getZoom();
      });

      // Update zoom level when the view zooms
      map.on("zoom", () => {
        zoom = map.getZoom();
      });
    };

    document.head.appendChild(link);

    return () => {
      map.remove();
      link.parentNode.removeChild(link);
    };
  });
</script>

<div bind:this={container} {id}>
  {#if map}
    <slot />
  {/if}
</div>

<style>
  :global(.mapboxgl-control-container button) {
    margin: 0;
  }
  div {
    width: 100%;
    height: 100%;
  }
</style>

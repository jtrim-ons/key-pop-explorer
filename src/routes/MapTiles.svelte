<script>
  import Tile from "$lib/layout/partial/Tile.svelte";
  import Tiles from "$lib/layout/Tiles.svelte";
  import Map from "$lib/map/Map.svelte";
  import MapSource from "$lib/map/MapSource.svelte";
  import MapLayer from "$lib/map/MapLayer.svelte";
  import BreaksChart from "$lib/chart/BreaksChart.svelte";
  import Table from "$lib/chart/Table.svelte";

  export let data;
  export let mapStyle;
  export let ladBounds;
  export let selected;
  export let colors;

  let hovered;
</script>

<Tiles title="Population by area">
  <Tile colspan={3} rowspan={1} blank>
    <p class="subtitle">
      For each lower-tier local authority area in England and Wales, the map
      shows the count of people in the categories chosen above as a percentage
      of the area's total population.
    </p>
  </Tile>
  <Tile colspan={2} rowspan={2} blank>
    <div style:height="450px">
      <Map style={mapStyle}>
        {#if data.geojson && data.geoPerc}
          <MapSource
            id="lad"
            type="geojson"
            data={data.geojson}
            promoteId={ladBounds.code}
          >
            <MapLayer
              id="lad-fill"
              data={data.geoPerc}
              geoCode="code"
              nameCode="name"
              colorCode="color"
              valueCode="value"
              hover={true}
              bind:hovered
              tooltip={true}
              type="fill"
              paint={{
                "fill-color": [
                  "case",
                  ["!=", ["feature-state", "color"], null],
                  ["feature-state", "color"],
                  "rgba(255, 255, 255, 0)",
                ],
                "fill-opacity": 0.8,
              }}
              order="highway_name_other"
            />
            <MapLayer
              id="lad-line"
              type="line"
              paint={{
                "line-color": "orange",
                "line-width": 2,
                "line-opacity": [
                  "case",
                  ["==", ["feature-state", "hovered"], true],
                  1,
                  0,
                ],
              }}
              order="highway_name_other"
            />
          </MapSource>
        {/if}
      </Map>
    </div>
    {#if data.geoBreaks && data.geoPerc}
      <div style:height="38px" style:width="100%">
        <BreaksChart
          breaks={data.geoBreaks}
          hovered={hovered && data.geoPerc.find((d) => d.code == hovered)
            ? data.geoPerc.find((d) => d.code == hovered).value
            : null}
          colors={data.geoBreaks[1] == 100 ? [colors.seq[4]] : colors.seq}
        />
      </div>
    {/if}
  </Tile>
  <Tile title="Areas with high %">
    {#if data.geoPerc && selected[0]}
      <Table
        data={[...data.geoPerc]
          .filter((d) => d.value != null)
          .sort((a, b) => b.value - a.value)
          .slice(0, 5)}
      />
    {:else}
      <span class="muted">Make a selection to see rankings.</span>
    {/if}
  </Tile>
  <Tile title="Areas with low %">
    {#if data.geoPerc && selected[0]}
      <Table
        data={data.geoPerc
          .filter((d) => d.value != null)
          .sort((a, b) => b.value - a.value)
          .slice(-5)}
        offset={data.geoPerc.filter((d) => d.value != null).length - 4}
      />
    {:else}
      <span class="muted">Make a selection to see rankings.</span>
    {/if}
  </Tile>
</Tiles>

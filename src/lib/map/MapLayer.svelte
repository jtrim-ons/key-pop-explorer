<script>
	import { getContext } from 'svelte';
	import { createEventDispatcher } from 'svelte';
	import mapbox from "mapbox-gl";

	const dispatch = createEventDispatcher();

	const popup = new mapbox.Popup({
    closeButton: false,
    closeOnClick: false
  });
	
	export let id;
	export let type;
	export let filter = null;
	export let layout = {};
	export let paint = {};
	export let data = null;
	export let geoCode = null;
	export let colorCode = null;
	export let nameCode = null;
	export let valueCode = null;
	export let click = false;
	export let ignoreClick = false;
	export let clickCenter = false;
	export let selected = null;
	export let hover = false;
	export let hovered = null;
	export let highlight = false;
	export let highlightKey = 'highlighted';
	export let highlighted = [];
	export let order = null;
	export let maxzoom = null;
	export let minzoom = null;
	export let tooltip = false;
	
	const { source, sourceLayer } = getContext('source');
	const { getMap } = getContext('map');
	const map = getMap();
	
	let selectedPrev = null;
	let hoveredPrev = null;
	let highlightedPrev = [];
	
	if (map.getLayer(id)) {
    map.removeLayer(id);
	}
	
	let options = {
		'id': id,
		'type': type,
		'source': source,
		'paint': paint,
		'layout': layout
	};

	if (filter) {
		options['filter'] = filter;
	}
	
	if (sourceLayer) {
		options['source-layer'] = sourceLayer;
	}
	if (maxzoom) {
		options['maxzoom'] = maxzoom;
	}
	if (minzoom) {
		options['minzoom'] = minzoom;
	}
	
	map.addLayer(options, order);

	// Updates "color" feature states for all geo codes
	// Assumes that each data point has the colours defined on the colorCode key
	function updateColors() {
		data.forEach(d => {
			map.setFeatureState({
				source: source,
				sourceLayer: sourceLayer,
				id: d[geoCode]
			}, {
				color: colorCode ? d[colorCode] : null,
				name: nameCode ? d[nameCode] : null,
				value: valueCode ? d[valueCode] : null
			});
		});
	}

	$: (data || colorCode) && updateColors();

	// Updates the "highlighted" feature state as geo codes are added to/removed from the highlighted array
	$: if (highlight && highlighted != highlightedPrev) {
		if (highlightedPrev[0]) {
			highlightedPrev.forEach(code => {
				let state = {};
				state[highlightKey] = false;
				map.setFeatureState(
					{ source: source, sourceLayer: sourceLayer, id: code },
					state
				);
			});
		}
		highlightedPrev = highlighted;
		if (highlighted[0]) {
			highlighted.forEach(code => {
				let state = {};
				state[highlightKey] = true;
				map.setFeatureState(
					{ source: source, sourceLayer: sourceLayer, id: code },
					state
				);
			});
		}
	}
	
	// Adds a click event to change the selected geo code (if click = true for map layer)
	if (click) {
		map.on('click', id, (e) => {
      if (e.features.length > 0 && !ignoreClick) {
				selected = e.features[0].id;

				dispatch('select', {
					code: selected
				});
				
				if (selectedPrev) {
					map.setFeatureState(
            { source: source, sourceLayer: sourceLayer, id: selectedPrev },
            { selected: false }
          );
				}
				
				map.setFeatureState(
          { source: source, sourceLayer: sourceLayer, id: selected },
          { selected: true }
				);

				if (clickCenter) {
					let center = centroid(e.features[0].toJSON().geometry);
					map.flyTo({
						center: center.geometry.coordinates
					});
				}
				
				selectedPrev = selected;
			}
    });
	}
	
	// Updates the selected geo code if it is changed elsewhere in the app (outside of this component)
	$: if (click && selected != selectedPrev) {
		if (selectedPrev) {
			map.setFeatureState(
				{ source: source, sourceLayer: sourceLayer, id: selectedPrev },
				{ selected: false }
			);
		}
		if (selected) {
			map.setFeatureState(
				{ source: source, sourceLayer: sourceLayer, id: selected },
				{ selected: true }
			);
		}
		selectedPrev = selected;
	}
	
	// Adds an event to update the hovered geo code when the mouse is moved over the map
	if (hover) {
		map.on('mousemove', id, (e) => {
      if (e.features.length > 0) {
        if (hovered) {
          map.setFeatureState(
            { source: source, sourceLayer: sourceLayer, id: hovered },
            { hovered: false }
          );
        }
				hovered = hoveredPrev = e.features[0].id;

        map.setFeatureState(
          { source: source, sourceLayer: sourceLayer, id: hovered },
          { hovered: true }
        );

        // Change the cursor style as a UI indicator.
				map.getCanvas().style.cursor = 'pointer';

				// Show popup
				let state = map.getFeatureState({ source: source, sourceLayer: sourceLayer, id: hovered });

				if (tooltip && state.name) {
					popup
						.setLngLat(e.lngLat)
						.setHTML(`<strong>${state.name}</strong>${state.value != null ? "<br/>" + state.value.toFixed(1) + "%" : "<br/>Data not available"}`)
						.addTo(map);
				}
      }
		});
		
		map.on('mouseleave', id, (e) => {
			if (hovered) {
        map.setFeatureState(
          { source: source, sourceLayer: sourceLayer, id: hovered },
          { hovered: false }
				);
      }
			hovered = hoveredPrev = null;
			
			// Reset cursor and remove popup
			map.getCanvas().style.cursor = '';
			if (tooltip) {
				popup.remove();
			}
    });
	}
	
	// Updates the hovered geo code if it is changed elsewhere in the app (outside of this component)
	$: if (hover && hovered != hoveredPrev) {
		if (hoveredPrev) {
			map.setFeatureState(
				{ source: source, sourceLayer: sourceLayer, id: hoveredPrev },
        { hovered: false }
			);
		}
		if (hovered) {
			map.setFeatureState(
				{ source: source, sourceLayer: sourceLayer, id: hovered },
        { hovered: true }
			);
		}
		hoveredPrev = hovered;
	}
	
</script>

<style>
	:global(.mapboxgl-popup-content) {
		pointer-events: none !important;
		padding: 2px 5px !important;
		color: black;
	}
</style>
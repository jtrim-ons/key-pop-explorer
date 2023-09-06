import allClassifications from './all-classifications.json';
import inputClassifications from './input-classifications.json';
import outputClassifications from './output-classifications-with-details';
import outputClassificationsCategorised from './output-classifications-categorised';
import populationBases_ from "$lib/population-bases.json";
import unblockedCombinationCounts_ from "$lib/unblocked-combination-counts";
import mapStyle_ from "$lib/map-style.json";

export const unblockedCombinationCounts = unblockedCombinationCounts_;
export const populationBases = populationBases_;

// CORE CONFIG
export const themes = {
	'light': {
		'name': 'light',
		'text': '#222',
		'muted': '#777',
		'pale': '#f0f0f0',
		'background': '#fff'
	},
	'dark': {
		'name': 'dark',
    'text': '#fff',
    'muted': '#bbb',
    'pale': '#333',
    'background': '#222'
  }
};

export const texts = {
	comparison: 'vs whole population',
	nodata: 'Data not available.',
	blocked: '(TODO: reword or just do\'t show chart?) Data not available due to disclosure control'
};

export const colors = {
	cat: ['#206095', '#A8BD3A', '#003C57', '#27A0CC', '#118C7B', '#F66068', '#746CB1', '#22D0B6', 'lightgrey'],
	seq: ["#d5f690", "#5bc4b1", "#2e9daa", "#0079a2", "#005583"],
	nodata: "#999"
};
export const spacer = '&nbsp;&nbsp;&nbsp;&nbsp;';
export const arrow = '&rtrif;&nbsp;&nbsp;'

export const codes = {};
outputClassifications.forEach(c => {
	const classification = allClassifications[c.code];
	if (c.categories == null) {
		codes[classification.id] = classification.categories
			.filter(d => d.id != '-8')
			.map(d => ({label: d.label, cells: [d.id]}));
	} else {
		codes[classification.id] = c.categories;
	}
});

// The datasets used for charts
export let datasets = [
  {
		key: 'residents',
		code: 'Usual-Residents',
		tables: [],
		tablesCategorised: []
	}
];

outputClassifications.forEach(c => {
	const classification = allClassifications[c.code];
    datasets[0].tables.push({
        key: classification.label,
        code: classification.id
    });
});

outputClassificationsCategorised.forEach(category => {
	datasets[0].tablesCategorised.push({
		categoryName: category.category_name,
		tables: []
	});
	for (const code of category.classification_codes) {
		const classification = allClassifications[code];
			datasets[0].tablesCategorised[datasets[0].tablesCategorised.length - 1].tables.push({
				key: classification.label,
				code: classification.id
		});

	}
});

export let vars = [];

inputClassifications.forEach(c => {
    c = allClassifications[c];
    vars.push({
        label: c.label,
				shortLabel: c.label.replace(new RegExp(" \\(.*$"), ""),
        key: c.id,
        cats: c.categories.filter(d => d.id !== '-8').map(d => ({
            var: c.id,
            code: d.id,
            label: d.label,
						newFormat: true
        }))
    });
});

vars.sort((a, b) => a.label.localeCompare(b.label));

function nestVars(vars) {
	var shortLabels = new Set(vars.map(v => v.shortLabel));
	var nested = {};
	for (let v of vars) {
		nested[v.shortLabel] ||= [];
		nested[v.shortLabel].push(v);
	}
	for (let l of shortLabels) {
		nested[l].sort((a, b) => a.cats.length - b.cats.length);
	}
	let result = [];
	shortLabels.forEach(label => result.push({label, vars: nested[label]}));
	return result;
}

export let varsNested = nestVars(vars);
console.log(varsNested)

export const mapStyle = mapStyle_;
export const ladBounds = {
	url: "/data/ltla2021.json",
	layer: "ltla",
	code: "areacd",
	name: "areanm"
}

export const maskRanges = {
	"resident_age_3a": {
		"1": [0, 3.2],
		"2": [3.2, 13],
		"3": [13, 18]
	},
	"resident_age_8d": {
		"1": [0, 3.2],
		"2": [3.2, 5],
		"3": [5, 7],
		"4": [7, 9],
		"5": [9, 11],
		"6": [11, 13],
		"7": [13, 15],
		"8": [15, 18]
	},
	"resident_age_18b": {
	}
};

for (let i=0; i<18; i++) {
	maskRanges.resident_age_18b["" + (i + 1)] = [i, i + 1];
}

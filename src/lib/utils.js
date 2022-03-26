import { feature } from 'topojson-client';

const endpoint = 'https://ftb-api-ext.ons.sensiblecode.io/graphql';
const frag = `
fragment tableDimensions on Table {
  dimensions {
    categories {
      code
    }
  }
}
`.replace(/\s+/g, " ");
const credentials = "YWhtYWQuYmFyY2xheTplbG9wZS5wdWNrLmhhaWxzLmV4cGxvcmU=";
const headers = new Headers({
  "Accept": "application/json",
  "Content-Type": "application/json",
  "Authorization": "Basic " + credentials
});

export async function getData(datasets, sel = [], fetch = window.fetch) {
  let selected = sel[0] ? [...sel].sort((a, b) => a.topic.localeCompare(b.topic)) : [...sel];

  let variables = [];
  let filters = [];
  let altVariables = [];
  let altFilters = [];

  if (selected[0]) {
    selected.forEach(item => {
      if (item.var) {
        variables.push(item.var);
        filters.push(`{variable: "${item.var}", codes: ["${item.code}"]}`);
        
        if (item.topic != "age group") {
          altVariables.push(item.var);
          altFilters.push(`{variable: "${item.var}", codes: ["${item.code}"]}`);
        }
      }
    });
  }

  variables = variables[0] ? '"' + variables.join('","') + '",' : '';
  filters = filters[0] ? '[' + filters.join(',') + ']' : '[]';
  altVariables = altVariables[0] ? '"' + altVariables.join('","') + '",' : '';
  altFilters = altFilters[0] ? '[' + altFilters.join(',') + ']' : '[]';

  let dats = [];
  datasets.forEach(dat => {
    let tabs = [];
    dat.tables.forEach(tab => {
      tabs.push(`
      ${tab.key}: table(
        variables: [${tab.key == "age" ? altVariables : variables}"${tab.code}"]
        filters: ${tab.key == "age" ? altFilters : filters}
      )
      {
        values
      }
      `);
    });
    let string = `
    ${dat.key}: dataset(name:"${dat.code}") {
      ${tabs.join('\n')}
    }
    `
    dats.push(string);
  });

  const query = `
  query {
    ${dats.join('\n')}
  }
  `.replace(/\s+/g, " ");

	const ops = {
		body: JSON.stringify({
			"query": query
		}),
		headers: headers,
		method: "POST",
		mode: "cors"
	};
	
	let response = await fetch(endpoint, ops);
  let json = await response.json();

  // Hack for filtering single year age data
  let ageSelection = selected.filter(d => d.topic == "age group");
  if (ageSelection[0] && json.data.residents.age.values) {
    let ages = [...json.data.residents.age.values];
    let cells = ageSelection[0].code.split('-');
    cells.forEach((d, i) => cells[i] = +d);
    ages.forEach((d, i) => ages[i] = i >= cells[0] && i <= cells[1] ? d : 0);
    json.data.residents.age.values = ages;
  }

  return json;
}

export async function getGeo(sel = [], fetch = window.fetch) {
  let selected = sel[0] ? [...sel].sort((a, b) => a.topic.localeCompare(b.topic)) : [...sel];
  let variables = [];
  let filters = [];
  if (selected[0]) {
    selected.forEach(item => {
      if (item.var) {
        variables.push(item.var);
        filters.push(`{variable: "${item.var}", codes: ["${item.code}"]}`);
      }
    });
  }
  let vars = variables[0] ? '"' + variables.join('","') + '",' : '';
  filters = filters[0] ? '[' + filters.join(',') + ']' : '[]';

  const query = `
  query {
    dataset(name:"Usual-Residents") {
      table(
        variables: ["LA"${vars}]
        filters: ${filters}
      )
      {
        ...tableDimensions
        values
      }
    }
  }
  `.replace(/\s+/g, " ");

	const ops = {
		body: JSON.stringify({
			"query": query + frag
		}),
		headers: headers,
		method: "POST",
		mode: "cors"
	};
	
	let response = await fetch(endpoint, ops);
  let json = await response.json();
  return json;
}

export function getColor(value, breaks, colors) {
  for (let i = 1; i < breaks.length; i ++) {
    if (value <= breaks[i]) {
      return colors[i - 1];
    }
  }
}

export function suffixer(int) {
  let mod = Math.round(int) % 10;
  return mod == 1 ? 'st' : mod == 2 ? 'nd' : mod == 3 ? 'rd' : 'th';
}

export function changeClass(val) {
  return val > 0 ? 'increase' : val < 0 ? 'decrease' : 'nochange';
}

export function changeStr(val, suffix = '', decimals = 0) {
  return val != 0 ? Math.abs(val).toFixed(decimals) + suffix : suffix == 'pp' ? 'n/c' : 'no change';
}

export async function getTopo(url, layer, fetch = window.fetch) {
  let response = await fetch(url);
  let json = await response.json();
  let geojson = await feature(json, layer);
  return geojson;
}

export function capitalise(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function makeSum(values) {
  return values ? values.reduce((a, b) => a + b) : 0;
}

export function isNA(arr) {
  let sum = arr ? arr.slice(0,-1).reduce((a, b) => a + b) : 0;
  return sum == 0;
}
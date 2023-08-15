import { feature } from 'topojson-client';

const endpoint = "https://raw.githubusercontent.com/jtrim-ons/key-pop-api-downloader/main/generated/";

function getSelString(sel) {
  let selected = [...sel].sort((a, b) => a.key.localeCompare(b.key));
  let selString = sel.length == 0 ?
      "data" :
      selected.map((s, i) => {
        if (i < selected.length - 1)
          return `${s.key}-${s.code}`;
        else
          return `${s.key}`;
      }).join('/');
  return {
    selString,
    lastCode: sel.length > 0 ? selected[selected.length-1].code : null
  };
}

export async function getData(datasets, sel = [], fetch = window.fetch) {
  console.log({datasets, sel});

  if (sel.length > 0 && !sel[0].newFormat) {
    throw new Error("OLD FORMAT!");
  }

  let {selString, lastCode} = getSelString(sel);
  let retval = {data: {}};

  let barChartData;
  if (sel.length === 0) {
    let url = `${endpoint}${sel.length}var_percent/${selString}.json`
    let response = await fetch(url);
    barChartData = await response.json();
  } else {
    let url = `${endpoint}${sel.length}var-combined_percent/${selString}.json`
    let response = await fetch(url);
    let json = await response.json();
    barChartData = json.bar_chart_data[lastCode];
    retval.mapData = json.map_data[lastCode];
    retval.total_pop = barChartData.total_pop;
  }

  for (let dataset of datasets) {
    retval.data[dataset.key] = {};
    for (let table of dataset.tables) {
      retval.data[dataset.key][table.code] = {values: barChartData[table.code]};
    }
  }

  console.log({barChartData, retval});

  return retval;
}

export function getColor(value, breaks, colors) {
  for (let i = 1; i < breaks.length; i++) {
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
  // TODO: check if this check is appropriate here.
  if (!values) return 0;

  let sum = 0;
  for (let i=0; i<values.length; i++)
    sum += values[i];
  // for (let key in values) {
  //   if (key != '-8') {
  //     sum += values[key];
  //   }
  // }
  return sum;
}

export function isNA(arr) {
  // FIXME
  return false;

  let sum = arr ? arr.slice(0,-1).reduce((a, b) => a + b) : 0;
  return sum == 0;
}

export function removeCategoryCountFromName(name) {
  return name.replace(new RegExp(" \\([0-9]* categories\\)"), "");
}
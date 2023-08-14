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

  if (sel.length == 0 || sel[0].newFormat) {
    console.log("NEW FORMAT!")
    let {selString, lastCode} = getSelString(sel);
    console.log(selString)
    let retval = {data: {}};
    {
      let url = `${endpoint}${sel.length}var_percent/${selString}.json`
      let response = await fetch(url);
      let json = await response.json();
      console.log(url)
      if (sel.length > 0)
        json = json[lastCode];
      json.newFormat = true;

      console.log({tmpjson: json})
      
      for (let dataset of datasets) {
        retval.data[dataset.key] = {};
        for (let table of dataset.tables) {
          retval.data[dataset.key][table.code] = {values: json[table.code]};
        }
      }

      if (sel.length > 0) {
        retval.total_pop = json.total_pop;
      }
      console.log({json, retval});
    }
    return retval;
  }

  throw "OLD FORMAT!";
}

export async function getGeo(sel = [], fetch = window.fetch) {
  let {selString, lastCode} = getSelString(sel);
  let url = `${endpoint}${sel.length}var-by-ltla_percent/${selString}_by_geog.json`
  console.log({url});
  let response = await fetch(url);
  let json = await response.json();
  if (sel.length > 0)
    json = json[lastCode];
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
<script>
  import { assets } from "$app/paths";
  import { page } from "$app/stores";
  import { setContext } from "svelte";
  import "../app.css";
  import "../mapbox-gl@1.13.0-mapbox-gl.css";
  import { themes } from "$lib/config";
  import Warning from "$lib/ui/Warning.svelte";
  import ONSHeader from "$lib/layout/ONSHeader.svelte";
  import ONSFooter from "$lib/layout/ONSFooter.svelte";

  let path = $page.url.pathname;
  let lang = $page.url.hostname.split(".")[0] == "cy" ? "cy" : "en";
  let baseurl = lang == "cy" ? "//cy.ons.gov.uk" : "//www.ons.gov.uk";

  // STYLE CONFIG
  // Set theme globally (options are 'light' or 'dark')
  let theme = "light";
  setContext("theme", themes[theme]);
</script>

<svelte:head>
  <link rel="icon" href="{assets}/favicon.png" />
</svelte:head>

<Warning>
  WARNING! This is a prototype. Data is synthetic. It is NOT actual 2021 Census
  data.
</Warning>

<ONSHeader {baseurl} {path} {lang} />

<main id="main" tabindex="-1">
  <slot />
</main>

<ONSFooter {baseurl} {lang} />

<script>
	import { onMount } from "svelte";
	
	export let path;
	let menuExpanded = false;
	let searchExpanded = false;
	// let lang = "en";

	let baseurl = "//www.ons.gov.uk";
	
	let menu = [
		{
			label: "Business, industry and trade",
			url: "/businessindustryandtrade",
			expanded: false,
			children: [
				{label: "Business", url: "/businessindustryandtrade/business"},
				{label: "Changes to business", url: "/businessindustryandtrade/changestobusiness"},
				{label: "Construction industry", url: "/businessindustryandtrade/constructionindustry"},
				{label: "IT and internet industry", url: "/businessindustryandtrade"},
				{label: "International trade", url: "/businessindustryandtrade/itandinternetindustry"},
				{label: "Manufacturing and production industry", url: "/businessindustryandtrade/manufacturingandproductionindustry"},
				{label: "Retail industry", url: "/businessindustryandtrade/retailindustry"},
				{label: "Tourism industry", url: "/businessindustryandtrade/tourismindustry"}
			]
		},
		{
			label: "Economy",
			url: "/economy",
			expanded: false,
			children: [
				{label: "Economic output and productivity", url: "/economy/economicoutputandproductivity"},
				{label: "Environmental accounts", url: "/economy/environmentalaccounts"},
				{label: "Government, public sector and taxes", url: "/economy/governmentpublicsectorandtaxes"},
				{label: "Gross Domestic Product (GDP)", url: "/economy/grossdomesticproductgdp"},
				{label: "Gross Value Added (GVA)", url: "/economy/grossvalueaddedgva"},
				{label: "Inflation and price indices", url: "/economy/inflationandpriceindices"},
				{label: "Investments, pensions and trusts", url: "/economy/investmentspensionsandtrusts"},
				{label: "National accounts", url: "/economy/nationalaccounts"},
				{label: "Regional accounts", url: "/economy/regionalaccounts"}
			]
		},
		{
			label: "Employment and labour market",
			url: "/employmentandlabourmarket",
			expanded: false,
			children: [
				{label: "People in work", url: "/employmentandlabourmarket/peopleinwork"},
				{label: "People not in work", url: "/employmentandlabourmarket/peoplenotinwork"}
			]
		},
		{
			label: "People, population and community",
			url: "/peoplepopulationandcommunity",
			expanded: false,
			children: [
				{label: "Births, deaths and marriages", url: "/peoplepopulationandcommunity/birthsdeathsandmarriages"},
				{label: "Crime and justice", url: "/peoplepopulationandcommunity/crimeandjustice"},
				{label: "Cultural identity", url: "/peoplepopulationandcommunity/culturalidentity"},
				{label: "Education and childcare", url: "/peoplepopulationandcommunity/educationandchildcare"},
				{label: "Elections", url: "/peoplepopulationandcommunity/elections"},
				{label: "Health and social care", url: "/peoplepopulationandcommunity/healthandsocialcare"},
				{label: "Household characteristics", url: "/peoplepopulationandcommunity/householdcharacteristics"},
				{label: "Housing", url: "/peoplepopulationandcommunity/housing"},
				{label: "Leisure and tourism", url: "/peoplepopulationandcommunity/leisureandtourism"},
				{label: "Personal and household finances", url: "/peoplepopulationandcommunity/personalandhouseholdfinances"},
				{label: "Population and migration", url: "/peoplepopulationandcommunity/populationandmigration"},
				{label: "Well-being", url: "/peoplepopulationandcommunity/wellbeing"}
			]
		},
		{label: "Taking part in a survey?", url: "/surveys"},
		{label: "Release calendar", url: "/releasecalendar", secondary: true},
		{label: "Methodology", url: "/methodology", secondary: true},
		{label: "Media", url: "/news", secondary: true},
		{label: "About", url: "/aboutus", secondary: true},
		{label: "Blog", url: "https://blog.ons.gov.uk/", secondary: true}
	];
	
	function toggle_sm(e, i) {
		if (window.matchMedia("(max-width:767px)").matches) {
			e.preventDefault();
			menu[i].expanded = !menu[i].expanded;
		}
	}
	
	onMount(() => {
		path = path ? path : window.location.pathname;
	});
</script>

<header>
	<a class="skiplink" href="#main" tabindex="0">
	Skip to main content
	</a>
	<div id="pagePath" class="hide">{path}</div>
	<div class="wrapper">
		<div class="header col-wrap">
			<div class="col col--lg-one-third col--md-one-third">
				<a href="{baseurl}/">
				<img class="logo" src="https://cdn.ons.gov.uk/assets/images/ons-logo/v2/ons-logo.svg" alt="Office for National Statistics logo - Homepage">
				</a>
			</div>
			<div class="col col--lg-two-thirds col--md-two-thirds hide--sm print--hide language--js__container">
				<div class="language">
					<span>English (EN) | </span>
					<a href="//cy.ons.gov.uk{path}" class="language__link" lang="cy">Cymraeg (CY)</a>
				</div>
			</div>
			<div class="secondary-nav col col--lg-two-thirds col--md-two-thirds print--hide">
				<ul class="secondary-nav__list js-nav-clone__list">
					{#each menu.filter(d => d.secondary) as item}
					<li class="secondary-nav__item">
						<a class="secondary-nav__link js-nav-clone__link" href="{baseurl}{item.url}">{item.label}</a>
					</li>
					{/each}
				</ul>
			</div>
		</div>
	</div>
	<div class="primary-nav print--hide">
		<nav aria-label="Header links">
			<ul class="nav--controls">
				<li class="nav--controls__item" class:menu-is-expanded={menuExpanded}>
					<a href="#nav-primary" id="menu-toggle" aria-controls="nav-primary" aria-expanded="{menuExpanded}" class="nav--controls__menu" on:click|preventDefault={() => {menuExpanded = !menuExpanded; searchExpanded = false;}}>
					<span class="nav--controls__text">Menu</span>
					</a>
				</li>
				<li class="nav--controls__item" class:search-is-expanded={searchExpanded}>
					<a href="#nav-search" id="search-toggle" aria-controls="nav-search" aria-expanded="{searchExpanded}" class="nav--controls__search" on:click|preventDefault={() => {searchExpanded = !searchExpanded; menuExpanded = false;}}>
					<span class="nav--controls__text">{searchExpanded ? 'Hide search' : 'Search'}</span>
					</a>
				</li>
			</ul>
			<ul class="wrapper primary-nav__list" class:nav-main--hidden={!menuExpanded} id="nav-primary" aria-expanded="{menuExpanded}">
				<li class="primary-nav__item  js-nav"><a class="primary-nav__link col col--md-7 col--lg-9" href="{baseurl}/" style="color: #e5e6e7">Home</a></li>
				{#each menu as item, i}
				{#if item.children}
				<li class="primary-nav__item js-nav js-expandable" class:js-expandable-active={item.expanded}>
					<a class="primary-nav__link col col--md-8 col--lg-10" href="{baseurl}{item.url}" aria-expanded="false" aria-label="{item.label} sub menu" on:click={e => toggle_sm(e, i)}>
					<span aria-hidden="true" class="expansion-indicator"></span>
					<span class="submenu-title">
					{item.label}
					</span>
					</a>
					<ul class="primary-nav__child-list col col--md-16 col--lg-20 js-expandable__content jsEnhance" class:js-nav-hidden={!item.expanded} aria-expanded="{item.expanded}" aria-label="submenu">
						<li class="primary-nav__child-item js-expandable__child hide--md">
							<a class="primary-nav__child-link" tabindex="-1" href="{baseurl}{item.url}">{item.label}</a>
						</li>
						{#each item.children as child}
						<li class="primary-nav__child-item js-expandable__child">
							<a class="primary-nav__child-link" tabindex="-1" href="{baseurl}{child.url}">{child.label}</a>
						</li>
						{/each}
					</ul>
				</li>
				{:else}
				<li class="primary-nav__item  js-nav" class:hide--md={item.secondary}>
					<a class="primary-nav__link  col col--md-8 col--lg-10" href="{baseurl}{item.url}">
					{item.label}
					</a>
				</li>
				{/if}
				{/each}
				<li class="hide--md primary-nav__language">
					<span>English (EN) | </span>
					<a href="//cy.ons.gov.uk{path}" class="language__link">Cymraeg (CY)</a>
				</li>
			</ul>
		</nav>
	</div>
	<div class="search print--hide" class:nav-search--hidden={!searchExpanded} id="searchBar" aria-expanded="{searchExpanded}">
		<div class="wrapper" role="search">
			<form class="col-wrap search__form" action="{baseurl}/search">
				<label class="search__label col col--md-23 col--lg-24" for="nav-search">Search for a keyword(s) or time series ID</label>
				<input type="search" autocomplete="off" class="search__input col col--md-21 col--lg-32" id="nav-search" name="q" value="">
				<button type="submit" class="search__button col--md-3 col--lg-3" id="nav-search-submit">
				<span class="visuallyhidden">Search</span>
				<span class="icon icon-search--light"></span>
				</button>
			</form>
		</div>
	</div>
</header>
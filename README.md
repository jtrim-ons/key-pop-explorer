# key-pop-explorer
Next iteration of [this app](https://github.com/bothness/sub-profile), re-coded using SvelteKit.

## Methodology

The data is from the [ONS API](https://developer.ons.gov.uk/).

An example of the file format: Suppose you have selected age 16-64 and born in Ireland. The data is served to the web-app in a JSON file called `2var/country_of_birth_8a-2/resident_age_3a.json` (The `2` in the file name indicates that the second category for country of birth has been chosen.)

This file contains a JSON object of counts for each of the charts. For example, for `sex` we have `{ 1: 84937, 2: 76848 }`: 84937 females and 76848 males. The percentages shown - 52.5 and 47.5 are calculated in the browser, with the sum across all categories used as the denominator.  Rounding is carried out using `.toFixed()` in JavaScript.

For each lower tier local authority (LTLA), the map shows the percentage of people in that LTLA that are in the selected category. We again calcuate the percentage in the browser using JavaScript. The numerator is the number of people in the selected group (age 16-64 and born in Ireland). The denominator is the total of the male and female counts for that LTLA.
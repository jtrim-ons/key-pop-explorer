/** @type {import('@sveltejs/kit').Config} */
import adapter from '@sveltejs/adapter-static';

const production = process.env.NODE_ENV === 'production';

const config = {
	kit: {
		// hydrate the <div id="svelte"> element in src/app.html
		adapter: adapter({
			// Options below are defaults
			pages: 'build',
			assets: 'build',
			fallback:'404.html'
		}),
		prerender: {
			enabled: production
		},
		paths: {
			assets: production ? 'https://onsvisual.github.io/key-pop-explorer' : '',
			base: production ? '/key-pop-explorer' : ''
		}
	}
};

export default config;

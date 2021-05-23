const critical = require('critical');
const asyncPool = require("tiny-async-pool");
const getShopUrls = require('./getShopUrls');

require('events').EventEmitter.defaultMaxListeners = 50;

const dimensions = [{
	height: 640,	// moto G4
	width: 360
},
{
	height: 1024, // ipad
	width: 768
},
{
	height: 750, // macbook pro(ish)
	width: 1200
}];


function generateForPage(shopUrl) {
	console.log(`Generating critical css for url: ${shopUrl.url}...`)
	return critical.generate({
		src: shopUrl.url,
		dimensions: dimensions,
		extract: true,
		minify: true,
		ignore: {
			atrule: ['@font-face', '@keyframes', '@-moz-keyframes', '@-webkit-keyframes'],
			decl: (node, value) => /url\(/.test(value),
		},
		penthouse: {
			timeout: 60000
		}
	}).then(({css, html}) => {
		return {
			type: shopUrl.type,
			css: css
		}
	}).catch(e => {
		return {
			type: shopUrl.type,
			error: e
		}
	})
}

function printCriticalCssLiquid() {
	return `{% if template contains 'list-collections' %}\n  {% render 'critical-css-list-collections' %}\n
	{% elsif template contains 'collection' %}\n  {% render 'critical-css-collection' %}\n
	{% elsif template contains 'article' %}\n  {% render 'critical-css-article' %}\n
  {% elsif template contains 'blog' %}\n	{% render 'critical-css-blog' %}\n
	{% elsif template contains 'page' %}\n  {% render 'critical-css-page' %}\n
	{% elsif template contains 'product' %}\n  {% render 'critical-css-product' %}\n
	{% elsif template contains 'search' %}\n  {% render 'critical-css-search' %}\n
	{% else %}\n  {% render 'critical-css-index' %}\n
	{% endif %}`
}

async function generateForShop(shopifyAdmin, job, shopUrls) {
	const timeoutId = setTimeout(() => {
		throw new Error(`Timeout of ${process.env.TIMEOUT} exeeded for generating critical css`);
	}, process.env.TIMEOUT);

	shopUrls = shopUrls || await getShopUrls(shopifyAdmin);
	job.progress(20);
	const poolLimit = parseInt(process.env.CRITICAL_CSS_CONCURRENCY);
	const pages = await asyncPool(poolLimit, shopUrls, generateForPage);
	const failedPages = pages.filter(page => page.error);
	if(failedPages.length === pages.length) {
		let errMsg = "Failed to generate critical css for all pages.";

		if(failedPages[0].error && failedPages[0].error.file) {
			errMsg += ` We've detected errors in the following files: \n\n${failedPages[0].error.file}\n\n. You need to fix any errors in this file before you can generate critical css`
		}
		else {
			errMsg += "This is likely due to an error in one of your css files. You will need to fix any errors in your css files before they can be processed and the critical css extracted"

		}
		
		throw new Error(errMsg);
	}
	console.log(`Generated critical css for all pages of ${shopifyAdmin.shop}...`);
	job.progress(60);
	clearTimeout(timeoutId);
	return pages;
}


async function uploadShopifySnippets(shopifyAdmin, pages) {
	// Create a snippet for each page that has critical css
	const assetFetches = [];
	pages.forEach(async page => {
		const snippet = page.error
			? '<!-- There was an error generating critical css for this page -->'
			: `<style id="critical-css-${page.type}">${page.css}</style>`;

		assetFetches.push(shopifyAdmin.writeAsset({
			name: `snippets/critical-css-${page.type}.liquid`,
			value: snippet
		}));
	});
	
	assetFetches.push(shopifyAdmin.writeAsset({
		name: `snippets/critical-css.liquid`,
		value: printCriticalCssLiquid()
	}));

	await Promise.all(assetFetches);
}



module.exports = {
	generateForShop,
	generateForPage,
	uploadShopifySnippets
}

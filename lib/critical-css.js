const critical = require('critical');

// Testing out with homepage only. 
// TODO: Include all shopify pages - see critical-css.js
const pages = [
	{
		type: 'index',
		path: `/`
	},
	{
		type: 'list-collections',
		path: `/collections`
	},
	// {
	// 	type: 'collection',
	// 	url: `${shopUrl}/collections/all-products`
	// },
	// {
	// 	type: 'product',
	// 	url: `${shopUrl}/collections/plants/products/asparagus-fern`
	// },
	// {
	// 	type: 'search',
	// 	url: `${shopUrl}/search?q=plant&type=product`
	// },
	{
		type: 'customers',
		path: `/account/login`
	},
	// {
	// 	type: 'blog',
	// 	url: `${shopUrl}/blogs/blog`
	// },
	// {
	// 	type: 'article',
	// 	url: `${shopUrl}/blogs/blog/playing-with-concrete`
	// },
	// {
	// 	type: 'page',
	// 	url: `${shopUrl}/pages/contact`
	// }
];

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



function generateForPage(shop, page) {
	console.log(`Generating critical css for ${shop.url}${page.path}`);
	return critical.generate({
		src: `${shop.url}${page.path}`,
		dimensions: dimensions,
		extract: true,
		minify: true,
		ignore: {
			atrule: ['@font-face', '@keyframes', '@-moz-keyframes', '@-webkit-keyframes'],
			decl: (node, value) => /url\(/.test(value),
		}
	}).then(({css, html}) => {
		return {
			pageType: page.type,
			css: css
		}
	}).catch(e => {
		throw e;
	});
}

function printStyles(css) {
	let elseIf = '';
	let firstIf = '';
	let lastElse = '';
	css.forEach(page => {
		if(page.pageType === 'index') {
			lastElse = `{% else %}\n  <style id="critical-css-${page.pageType}">${page.css}</style>\n{% endif %}`;
		}
		else if(page.pageType === 'customers') {
			firstIf = `{% if template contains 'customers' %}\n  <style id="critical-css-${page.pageType}">${page.css}</style>\n`;
		}
		else {
			elseIf += `{% elsif template contains '${page.pageType}' %}\n  <style id="critical-css-${page.pageType}">${page.css}</style>\n`;
		}
	})
	return firstIf + elseIf + lastElse;
}

function generateForStore(shop, cb) {
	const promises = [];
	pages.forEach(page => {
		promises.push(generateForPage(shop, page));
	})

	Promise.all(promises).then(data => {
		console.log('Critical css generated for all pages');
		const criticalCss = printStyles(data);
		if(typeof cb === 'function') {
			cb(criticalCss);
		}
		return criticalCss;
	})
	.catch(e => {
		throw new Error('Error generating critical CSS');
	});
}

module.exports = {
	generateForStore
}

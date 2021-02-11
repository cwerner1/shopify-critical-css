const critical = require('critical');
const fs = require('fs');
const shopUrl = 'https://twigplants.co.uk';
const pages = [
	{
		type: 'index',
		url: `${shopUrl}`
	},
	{
		type: 'collection',
		url: `${shopUrl}/collections/all-products`
	},
	{
		type: 'list-collections',
		url: `${shopUrl}/collections`
	},
	{
		type: 'product',
		url: `${shopUrl}/collections/plants/products/asparagus-fern`
	},
	{
		type: 'search',
		url: `${shopUrl}/search?q=plant&type=product`
	},
	{
		type: 'customers',
		url: `${shopUrl}/account/login`
	},
	{
		type: 'blog',
		url: `${shopUrl}/blogs/blog`
	},
	{
		type: 'article',
		url: `${shopUrl}/blogs/blog/playing-with-concrete`
	},
	{
		type: 'page',
		url: `${shopUrl}/pages/contact`
	}
];

function generateCriticalCss(page) {
	return critical.generate({
		src: page.url,
		dimensions: [{
			height: 400,
			width: 400
		},
		{
			height: 768,
			width: 1024
		},
		{
			height: 700,
			width: 1300
		}],
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

function updateCriticalCss(pages) {
	let criticalCss = fs.readFileSync('snippets/critical-css.liquid', 'utf-8');
	const promises = [];
	pages.forEach(page => {
		promises.push(generateCriticalCss(page));
	})

	Promise.all(promises).then(data => {
		data.forEach(page => {
			const regex = new RegExp(`<style id="critical-css-${page.pageType}">(.*?)<\/style>`);
			criticalCss = criticalCss.replace(regex, `<style id="critical-css-${page.pageType}">${page.css}</style>`);
		})
		fs.writeFileSync('snippets/critical-css.liquid', criticalCss, 'utf-8');
	})
	.catch(e => {
		throw e;
	});
}

process.setMaxListeners(22)
updateCriticalCss(pages);
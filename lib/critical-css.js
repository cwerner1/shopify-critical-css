const critical = require('critical');

// Testing out with homepage only. 
// TODO: Include all shopify pages - see critical-css.js
	const pages = [
		{
			type: 'index',
			url: `/`
		}
	]


function generateForPage(shop, page) {
	console.log(`Generating critical css for ${page.type}`);
	return critical.generate({
		src: `${shop.url}${page.url}`,
		dimensions: [{
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

function generateForStore(shop, cb) {
	const promises = [];
	pages.forEach(page => {
		promises.push(generateForPage(shop, page));
	})

	Promise.all(promises).then(data => {
		console.log('Critical css generated for all pages');
		let criticalCss = '';
		data.forEach(page => {
			criticalCss += `<style id="critical-css-${page.pageType}">${page.css}</style>\n`;
		})
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

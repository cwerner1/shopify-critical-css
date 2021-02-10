const critical = require('critical');
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


function generateForPage(shop, shopUrl) {
	console.log(`> Generating critical css for ${shopUrl.url}`);
	return critical.generate({
		src: shopUrl.url,
		dimensions: dimensions,
		extract: true,
		minify: true,
		ignore: {
			atrule: ['@font-face', '@keyframes', '@-moz-keyframes', '@-webkit-keyframes'],
			decl: (node, value) => /url\(/.test(value),
		}
	}).then(({css, html}) => {
		console.log(`Finished generating for ${shopUrl.url}`);
		return {
			type: shopUrl.type,
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
		if(page.type === 'index') {
			lastElse = `{% else %}\n  <style id="critical-css-${page.type}">${page.css}</style>\n{% endif %}`;
		}
		else if(page.type === 'list-collections') {
			firstIf = `{% if template contains 'list-collections' %}\n  <style id="critical-css-${page.type}">${page.css}</style>\n`;
		}
		else {
			elseIf += `{% elsif template contains '${page.type}' %}\n  <style id="critical-css-${page.type}">${page.css}</style>\n`;
		}
	})
	return firstIf + elseIf + lastElse;
}

async function parallelExec(count, promises) {
	// Get first (count) promises
	// Execute them and store result in array
	function nextExec(c, p) {

	}
	const allPromises = 
	const results = [];	// results need to be stored in order
	let parallelPromises = [];
	for (let i = count; i > 0; i--) {
		parallelPromises.push(promises.shift());
	}
	console.log(parallelPromises);
	
	console.log(promises.length);
	const data = await Promise.all(parallelPromises);
    console.log(data);

	if(promises.length > 0) {
		parallelExec(count, promises);
	}
}

async function generateForShop(shopifyAdmin, cb) {
	console.log(`> Generating Critical css for shop: ${shopifyAdmin.shop}`)
	const criticalCss = [];
	const shopUrls = await getShopUrls(shopifyAdmin);
	const timeoutId = setTimeout(() => {
		throw new Error('Timeout of 60s exeeded for generating critical css');
	}, process.env.TIMEOUT);

	console.log(`> Generated shopify URLs`)
	shopUrls.forEach(async shopUrl => {
		const data = await generateForPage(shopifyAdmin.shop, shopUrl);
		criticalCss.push(data);
	});
	
	console.log('> Critical css generated for all pages');
	const criticalLiquid = printStyles(criticalCss);
	if(typeof cb === 'function') {
		cb(criticalLiquid);
	}
	clearTimeout(timeoutId);
	return criticalLiquid;
}

module.exports = {
	generateForShop
}

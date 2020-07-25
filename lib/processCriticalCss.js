require('isomorphic-fetch');
const ShopifyAdmin = require('../lib/shopify');
const criticalCss = require('../lib/critical-css');
const parseHtml = require('../lib/parseHtml');

async function processCriticalCss(accessToken, shop) {
	try {
		const shopifyAdmin = new ShopifyAdmin({
			accessToken: accessToken,
			shop: shop,
			version: '2020-04'
		})
		await shopifyAdmin.init();
		console.log('> ShopifyAdmin initalised')
		await criticalCss.generateForShop(shopifyAdmin, (criticalCss) => {
			shopifyAdmin.writeAsset({
				name: 'snippets/critical-css.liquid',
				value: criticalCss
			});
		});

		console.log('> Generated Critical CSS and uploaded to snippets/critical-css.liquid');
		const themeLiquid = await shopifyAdmin.getThemeLiquid();
		const updatedThemeLiquid = parseHtml(themeLiquid.value);
		// Diff and Only write if different
		await shopifyAdmin.writeAsset({
			name: 'layout/theme.liquid',
			value: updatedThemeLiquid
		});
		console.log("> Updated theme.liquid");
		console.log("> Success!")
		process.send({ status: 'success' });
		process.exit(0);
	}
	catch(e) {
		console.log(e);
		process.send({ ststus: 'error', error: e });
		process.exit(1)
	}
}

process.on('message', (msg) => {
	if(msg === 'start') {
		const shop = process.argv[process.argv.indexOf('--shop') + 1];
		const accessToken = process.argv[process.argv.indexOf('--accessToken') + 1];
		console.log(shop, accessToken);
		processCriticalCss(accessToken, shop);
	}
});
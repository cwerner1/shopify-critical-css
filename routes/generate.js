const ShopifyAdmin = require('../lib/shopify');
const criticalCss = require('../lib/critical-css');
const parseHtml = require('../lib/parseHtml');


module.exports = async (ctx, next) => {
	console.log('access token: ', ctx.session.accessToken)
	console.log('shop: ', ctx.session.shop)
	try {
		const shopifyAdmin = new ShopifyAdmin({
			accessToken: ctx.session.accessToken,
			shop: ctx.session.shop,
			version: '2020-04'
		})
		console.log('> ShopifyAdmin initalised')
		await shopifyAdmin.init();
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

		ctx.body = JSON.stringify({
			error: false,
			success: true
	 	});
	}
	catch(e) {
		console.log(e);
		ctx.body = JSON.stringify({
			isError: true,
			message: 'Could not generate critical css',
			error: e
		 });
	}
}
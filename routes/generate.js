const ShopifyAdmin = require('../lib/shopify');
const criticalCss = require('../lib/critical-css');
const parseHtml = require('../lib/parseHtml');


module.exports = async (ctx, next) => {
	console.log('access token: ', ctx.session.accessToken)
	console.log('shop: ', ctx.session.shop)
	try {
		const shopifyAdmin = new ShopifyAdmin({
			accessToken: ctx.session.accessToken,
			shop: ctx.session.shop
		})
		const shop = {
			url: `https://${ctx.session.shop}`
		}
		await shopifyAdmin.init();
		const themeLiquid = await shopifyAdmin.getThemeLiquid();
		const updatedThemeLiquid = parseHtml(themeLiquid.value);
		// Diff and Only write if different
		console.log("Writing updated theme.liquid");
		shopifyAdmin.writeAsset({
			name: 'layout/theme.liquid',
			value: updatedThemeLiquid
		});
	
		await criticalCss.generateForStore(shop, (criticalCss) => {
			shopifyAdmin.writeAsset({
				name: 'snippets/critical-css.liquid', 
				value: criticalCss
			});
		});

		ctx.body = JSON.stringify({
			error: false,
			themeId: shopifyAdmin.themeId,
			assets: shopifyAdmin.assets,
			criticalCss: generatedCss
	 	});
	}
	catch(e) {
		ctx.body = JSON.stringify({
			isError: true,
			message: 'Could not generate critical css',
			error: e
		 });
	}
}
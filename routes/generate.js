const ShopifyAdmin = require('../lib/shopify');
const criticalCss = require('../lib/critical-css');
const parseHtml = require('../lib/parseHtml');


module.exports = async (ctx, next) => {
	console.log('access token:', ctx.session.accessToken);
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
		console.log(updatedThemeLiquid);

		// TODO: Update theme.liquid with new value on shopify store

	
		const generatedCss = await criticalCss.generateForStore(shop, (criticalCss) => {
			shopifyAdmin.writeAsset('snippets/critical-css.liquid', criticalCss)
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
			themeId: shopifyAdmin.themeId,
			assets: shopifyAdmin.assets
		 });
	}
}
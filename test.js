// const fs = require('fs');
// const criticalCss = require('./lib/critical-css');
// let theme = fs.readFileSync('theme.liquid.new', 'utf-8');
// criticalCss.generateForStore({ url: 'https://dev-1987.myshopify.com/' }, theme);
require('isomorphic-fetch');
const ShopifyAdmin = require('./lib/shopify');
const getShopUrls = require('./lib/getShopUrls');

const shopifyAdmin = new ShopifyAdmin({
	shop: 'dev-1987.myshopify.com',
	accessToken: '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',
	version: '2020-04'
})

const a = async () => {
	await getShopUrls(shopifyAdmin);
}
a();
require('isomorphic-fetch');
const { generateForShop, uploadShopifySnippets } = require("../lib/critical-css");
const fs = require("fs");
const ShopifyAdmin = require("../lib/shopify");

process.env.TIMEOUT = 300000;
process.env.CRITICAL_CSS_CONCURRENCY = 1;

async function testShop() {
	const shopifyAdmin = new ShopifyAdmin({
		accessToken: '',
		shop: '',
		version: '2021-04'
	})

	await shopifyAdmin.init();
	console.log('after shopifyAdmin init()');
	try {
		const pages = await generateForShop(shopifyAdmin, { progress: () => null })
		// await uploadShopifySnippets(shopifyAdmin, pages);
	}
	catch(e) {
		console.log(e.message);
	}
	const memUsed = process.memoryUsage().heapUsed / 1024 / 1024;
	console.log(`Process used: ${memUsed}MB`);
}

try {
	testShop();
} catch(e) {
	console.log(e);
}

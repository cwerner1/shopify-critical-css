require('isomorphic-fetch');
const { generateForShop } = require("../lib/critical-css");
const fs = require("fs");
const ShopifyAdmin = require("../lib/shopify");

process.env.TIMEOUT = 300000;
process.env.CRITICAL_CSS_CONCURRENCY = 1;

async function testShop() {
	const shopifyAdmin = new ShopifyAdmin({
		accessToken: '',
		shop: '',
		version: '2020-04'
	})

	await shopifyAdmin.init();
	console.log('after shopifyAdmin init()');
	const pages = await generateForShop(shopifyAdmin, { progress: () => null })
	// pages.forEach(page => {
	// 	fs.writeFileSync(`test/critical-css-${page.type}.txt`, page.css)

	// })
	const memUsed = process.memoryUsage().heapUsed / 1024 / 1024;
	console.log(`Process used: ${memUsed}MB`);
}

testShop();

require('isomorphic-fetch');
const ShopifyAdmin = require('../lib/shopify');
const criticalCss = require('../lib/critical-css');
const parseHtml = require('../lib/parseHtml');
const throng = require('throng');
const Queue = require("bull");

// Connect to a local redis instance locally, and the Heroku-provided URL in production
let REDIS_URL = process.env.REDIS_URL || "redis://127.0.0.1:6379";

// Spin up multiple processes to handle jobs to take advantage of more CPU cores
// See: https://devcenter.heroku.com/articles/node-concurrency for more info
let workers = process.env.WEB_CONCURRENCY || 2;

let maxJobsPerWorker = 50;

async function processCriticalCss(accessToken, shop) {
	// Connect to the named work queue
	let workQueue = new Queue('critical-css', REDIS_URL);

	workQueue.process(maxJobsPerWorker, async (job) => {
		job.progress = 0;
		const shopifyAdmin = new ShopifyAdmin({
			accessToken: accessToken,
			shop: shop,
			version: '2020-04'
		})
		await shopifyAdmin.init();
		
		job.progress(10);
		console.log('> ShopifyAdmin initalised')
		
		await criticalCss.generateForShop(shopifyAdmin, (criticalCss) => {
			shopifyAdmin.writeAsset({
				name: 'snippets/critical-css.liquid',
				value: criticalCss
			});
		});
		job.progress(80);
		console.log('> Generated Critical CSS and uploaded to snippets/critical-css.liquid');
		
		const themeLiquid = await shopifyAdmin.getThemeLiquid();
		const updatedThemeLiquid = parseHtml(themeLiquid.value);
		// Diff and Only write if different
		await shopifyAdmin.writeAsset({
			name: 'layout/theme.liquid',
			value: updatedThemeLiquid
		});
		job.progress(100);
		console.log("> Updated theme.liquid");
		console.log("> Success!")
		process.send({ status: 'success' });
		process.exit(0);
	});
}

throng({ workers, processCriticalCss });
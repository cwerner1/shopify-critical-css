require('isomorphic-fetch');
const ShopifyAdmin = require('./lib/shopify');
const criticalCss = require('./lib/critical-css');
const parseThemeLiquid = require('./lib/parseThemeLiquid');
const reverseThemeLiquid = require('./lib/reverseThemeLiquid');
const throng = require('throng');
const Queue = require("bull");

// Connect to a local redis instance locally, and the Heroku-provided URL in production
let REDIS_URL = process.env.REDIS_URL || "redis://127.0.0.1:6379";

// Spin up multiple processes to handle jobs to take advantage of more CPU cores
// See: https://devcenter.heroku.com/articles/node-concurrency for more info
let workers = process.env.WEB_CONCURRENCY || 2;

let maxJobsPerWorker = 50;

/**
 * Initialise ShopifyAdmin instance
 * @param {Object} options 
 */
async function initShopifyAdmin({ shop, accessToken}) {
	const shopifyAdmin = new ShopifyAdmin({
		accessToken: accessToken,
		shop: shop,
		version: '2020-04'
	})
	await shopifyAdmin.init();
	return shopifyAdmin;
}

/**
 * Turn ON critical css for the shop
 * @param {Object} job 
 * @param {Object} shopifyAdmin 
 */
async function criticalCssGenerate(job, shopifyAdmin) {
	await criticalCss.generateForShop(shopifyAdmin, job, (criticalCss) => {
		shopifyAdmin.writeAsset({
			name: 'snippets/critical-css.liquid',
			value: criticalCss
		});
		console.log('Created snippets/critical-css.liquid...');
	});
	job.progress(80);
	
	const themeLiquid = await shopifyAdmin.getThemeLiquid();
	const updatedThemeLiquid = parseThemeLiquid(themeLiquid.value);
	// Diff and Only write if different
	await shopifyAdmin.writeAsset({
		name: 'layout/theme.liquid',
		value: updatedThemeLiquid
	});
	console.log('Updated layout/theme.liquid...');
	job.progress(90);
}

/**
 * Turn OFF critical css for the shop
 * @param {Object} job 
 * @param {Object} shopifyAdmin 
 */
async function criticalCssRestore(job, shopifyAdmin) {
	await shopifyAdmin.deleteAsset('snippets/critical-css.liquid');
	const themeLiquid = await shopifyAdmin.getThemeLiquid();
	const updatedThemeLiquid = reverseThemeLiquid(themeLiquid.value);
	// Diff and Only write if different
	await shopifyAdmin.writeAsset({
		name: 'layout/theme.liquid',
		value: updatedThemeLiquid
	});
}


function start() {
	// Connect to the named work queue
	let workQueue = new Queue('critical-css', REDIS_URL, { 
		redis: {
			tls: { rejectUnauthorized: false }
		}
	});

	workQueue.process(maxJobsPerWorker, async (job) => {
		job.progress(0);
		try {
			const shopifyAdmin = await initShopifyAdmin({
				shop: job.data.shop,
				accessToken: job.data.accessToken
			});
			job.progress(10);
	
			if(job.data.type === 'generate') {
				await criticalCssGenerate(job, shopifyAdmin);
			}
			if(job.data.type === 'restore') {
				await criticalCssRestore(job, shopifyAdmin);
			}
			job.progress(100);
			return { success: true };
		} catch (e) {
			console.log(e);
			throw e;
		}
	});
}

throng({ workers, start });
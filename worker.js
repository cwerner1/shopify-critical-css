require('isomorphic-fetch');
const throng = require('throng');
const Queue = require("bull");
const ShopifyAdmin = require('./lib/shopify');
const { generateForShop, uploadShopifySnippets } = require('./lib/critical-css');
const parseThemeLiquid = require('./lib/parseThemeLiquid');
const restoreThemeLiquid = require('./lib/restoreThemeLiquid');
const RedisStore = require('./lib/redis-store');

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
		version: '2021-04'
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
	try {
		const pages = await generateForShop(shopifyAdmin, job)
		await uploadShopifySnippets(shopifyAdmin, pages);
		const failed = pages.filter(page => page.error);
		job.progress(80);
		if(failed.length === 0) {
			// Update theme.liquid
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
		
		const memUsed = process.memoryUsage().heapUsed / 1024 / 1024;
		console.log(`Generating critical css used: ${memUsed}MB`);
		return pages.map(page => { 
			return {
				type: page.type,
				error: page.error,
				success: !!!page.error
			}
		});
	} catch(e) {
		throw e;
	}
}

/**
 * Turn OFF critical css for the shop
 * @param {Object} job 
 * @param {Object} shopifyAdmin 
 */
async function criticalCssRestore(job, shopifyAdmin, redisStore) {
	const p = [];
	p.push(shopifyAdmin.deleteAsset('snippets/critical-css.liquid'));
	p.push(shopifyAdmin.deleteAsset('snippets/critical-css-index.liquid'));
	p.push(shopifyAdmin.deleteAsset('snippets/critical-css-collection.liquid'));
	p.push(shopifyAdmin.deleteAsset('snippets/critical-css-list-collections.liquid'));
	p.push(shopifyAdmin.deleteAsset('snippets/critical-css-product.liquid'));
	p.push(shopifyAdmin.deleteAsset('snippets/critical-css-blog.liquid'));
	p.push(shopifyAdmin.deleteAsset('snippets/critical-css-article.liquid'));
	p.push(shopifyAdmin.deleteAsset('snippets/critical-css-search.liquid'));
	p.push(shopifyAdmin.deleteAsset('snippets/critical-css-page.liquid'));
	await Promise.all(p);

	const themeLiquid = await shopifyAdmin.getThemeLiquid();
	const updatedThemeLiquid = await restoreThemeLiquid(themeLiquid.value, redisStore, shopifyAdmin.shop);
	// Diff and Only write if different
	await shopifyAdmin.writeAsset({
		name: 'layout/theme.liquid',
		value: updatedThemeLiquid
	});
}


function start() {

	const redisStore = new RedisStore();

	// Connect to the named work queue
	let workQueue = new Queue('critical-css', REDIS_URL, {
		redis: {
			tls: { rejectUnauthorized: false }
		}
	});

	workQueue.process(maxJobsPerWorker, async (job) => {
		job.progress(0);
		let result;
		try {
			const shopifyAdmin = await initShopifyAdmin({
				shop: job.data.shop,
				accessToken: job.data.accessToken
			});
			job.progress(10);
	
			if(job.data.type === 'generate') {
				result = await criticalCssGenerate(job, shopifyAdmin);
			}
			if(job.data.type === 'restore') {
				result = await criticalCssRestore(job, shopifyAdmin, redisStore);
			}
			job.progress(100);
			
			return result;
		} catch (e) {
			console.log(e);
			throw e;
		}
	});
}

throng({ workers, start });
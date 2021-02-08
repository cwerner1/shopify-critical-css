require('isomorphic-fetch');
const dotenv = require('dotenv');
const Koa = require('koa');
const Router = require('koa-router');
const next = require('next');
const { default: createShopifyAuth } = require('@shopify/koa-shopify-auth');
const { verifyRequest } = require('@shopify/koa-shopify-auth');
const session = require('koa-session');

dotenv.config();

const port = parseInt(process.env.PORT, 10) || 3000;
const dev = process.env.NODE_ENV !== 'production';
const nextApp = next({ dev });
const handle = nextApp.getRequestHandler();
const { SHOPIFY_API_KEY, SHOPIFY_API_SECRET_KEY } = process.env;

let Queue = require('bull');

// Connect to a local redis intance locally, and the Heroku-provided URL in production
let REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

// Create / Connect to a named work queue
let workQueue = new Queue('critical-css', REDIS_URL);

nextApp.prepare().then(() => {
	const server = new Koa();
	const router = new Router();


	server.use(session({ secure: true, sameSite: 'none' }, server));
	server.keys = [SHOPIFY_API_SECRET_KEY];
	server.use(createShopifyAuth({
		apiKey: SHOPIFY_API_KEY,
		secret: SHOPIFY_API_SECRET_KEY,
		scopes: [
			'read_themes', 
			'write_themes',
			'read_products',
			'read_content',
			'read_product_listings'
		],
		afterAuth(ctx) {
			const { shop, accessToken } = ctx.session;
			console.log(`Authenticated for ${shop} with token: ${accessToken}`)
			ctx.token = accessToken;
			ctx.redirect(`https://${shop}/admin/apps/critical-css`)
		}
	}))

	server.use(verifyRequest());
	
	// Turn on critical css
	router.post('/generate', async (ctx, next) => {
		console.log('access token: ', ctx.session.accessToken)
		console.log('shop: ', ctx.session.shop)
		const job = await workQueue.add({
			type: 'generate',
			shop: ctx.session.shop,
			accessToken: ctx.session.accessToken
		});

		ctx.body = JSON.stringify({ id: job.id });
	});

	// Turn off critical css
	router.post('/restore', async (ctx, next) => {
		console.log('access token: ', ctx.session.accessToken)
		console.log('shop: ', ctx.session.shop)

		const job = await workQueue.add({
			type: 'restore',
			shop: ctx.session.shop,
			accessToken: ctx.session.accessToken
		});
		
		ctx.body = JSON.stringify({ id: job.id });
	});

	// Get Job route
	router.get('/job/:id', async (ctx, next) => {
		// Allows the client to query the state of a background job
		let pathArr = ctx.path.split('/');
		let id = pathArr[2];
		let job = await workQueue.getJob(id);
	
		if (job === null) {
			ctx.response.status = 404;
		} else {
			let state = await job.getState();
			let progress = job._progress;
			let reason = job.failedReason;
			ctx.body = JSON.stringify({ id, state, progress, reason, type: job.data.type });
		}
	});

	server.use(router.routes());
	server.use(router.allowedMethods());	
	
	server.use(async(ctx) => {
		await handle(ctx.req, ctx.res);
		ctx.respond = false;
		ctx.res.statusCode = 200;
		return;
	})

	// You can listen to global events to get notified when jobs are processed
	workQueue.on('global:completed', (jobId, result) => {
	  console.log(`Job ${jobId} completed with result ${result}`);
	});


	server.listen(port, () => {
		console.log(`> Ready on http://localhost:${port}`);
	})
});
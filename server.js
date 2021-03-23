require('isomorphic-fetch');
const dotenv = require('dotenv');
const Koa = require('koa');
const Router = require('koa-router');
const next = require('next');
const { default: shopifyAuth, verifyRequest } = require('@shopify/koa-shopify-auth');
const { Shopify, ApiVersion } = require('@shopify/shopify-api');
const Queue = require('bull');
const getSubscriptionUrl = require('./lib/getSubscriptionUrl');
const RedisStore = require('./lib/redis-store');

dotenv.config();
const port = parseInt(process.env.PORT, 10) || 3000;
const dev = process.env.NODE_ENV !== 'production';
const nextApp = next({ dev });
const handle = nextApp.getRequestHandler();

// Create a new instance of the custom storage class
const sessionStorage = new RedisStore();


// initializes the library
Shopify.Context.initialize({
  API_KEY: process.env.SHOPIFY_API_KEY,
  API_SECRET_KEY: process.env.SHOPIFY_API_SECRET,
  SCOPES: process.env.SHOPIFY_APP_SCOPES,
  HOST_NAME: process.env.SHOPIFY_APP_URL.replace(/^https:\/\//, ''),
  API_VERSION: ApiVersion.October20,
  IS_EMBEDDED_APP: true,
  SESSION_STORAGE: new Shopify.Session.CustomSessionStorage(
    sessionStorage.storeCallback,
    sessionStorage.loadCallback,
    sessionStorage.deleteCallback,
  ),
});

// Storing the currently active shops in memory will force them to re-login when your server restarts. You should
// persist this object in your app.
const ACTIVE_SHOPIFY_SHOPS = {};

// Connect to a local redis intance locally, and the Heroku-provided URL in production
let REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

// Create / Connect to a named work queue
let workQueue = new Queue('critical-css', REDIS_URL);

nextApp.prepare().then(() => {
	const server = new Koa();
	server.keys = [Shopify.Context.API_SECRET_KEY];
	const gdprRouter = new Router();

	gdprRouter.post('/customers/redact', (ctx, next) => {
		// No customeer or shop data is stored, so we only log the request
		console.log('new /customers/redact request with data', ctx.request.body);
		ctx.body = "Request received successfully"
	});

	gdprRouter.post('/shop/redact', (ctx, next) => {
		// No customeer or shop data is stored, so we only log the request
		console.log('new /shop/redact request with data', ctx.request.body);
		ctx.body = "Request received successfully"
	});
	gdprRouter.post('/customers/data-request', (ctx, next) => {
		// No customeer or shop data is stored, so we only log the request
		console.log('new /customers/data-request request with data', ctx.request.body);
		ctx.body = "Request received successfully"
	});

	server.use(gdprRouter.routes());
	server.use(shopifyAuth({
		async afterAuth(ctx) {
			const { shop, accessToken } = ctx.state.shopify;
			ACTIVE_SHOPIFY_SHOPS[shop] = true;

			// Your app should handle the APP_UNINSTALLED webhook to make sure merchants go through OAuth if they reinstall it
      const response = await Shopify.Webhooks.Registry.register({
        shop,
        accessToken,
        path: "/webhooks",
        topic: "APP_UNINSTALLED",
        webhookHandler: async (topic, shop, body) => delete ACTIVE_SHOPIFY_SHOPS[shop],
      });

			if (!response.success) {
        console.log(
          `Failed to register APP_UNINSTALLED webhook: ${response.result}`
        );
      }

			const returnUrl = `https://${shop}/admin/apps/critical-css?shop=${shop}`;
			// const subscriptionUrl = await getSubscriptionUrl(accessToken, shop, returnUrl);
			ctx.redirect(returnUrl);
		}
	}))
	
	const router = new Router();

	// Turn on critical css
	router.get('/generate', async (ctx) => {
		const session = await Shopify.Utils.loadCurrentSession(ctx.req, ctx.res, true);
		
		const job = await workQueue.add({
			type: 'generate',
			shop: session.shop,
			accessToken: session.accessToken
		});
		console.log(`created job ${job.id}`);
		ctx.body = JSON.stringify({ id: job.id });
	});

	// Turn off critical css
	router.get('/restore', async (ctx) => {
		const session = await Shopify.Utils.loadCurrentSession(ctx.req, ctx.res, true);
		const job = await workQueue.add({
			type: 'restore',
			shop: session.shop,
			accessToken: session.accessToken
		});
		console.log(`created job ${job.id}`);
		ctx.body = JSON.stringify({ id: job.id });
	});

	// Get Job route
	router.get('/job/:id', async (ctx) => {
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

	const handleRequest = async (ctx) => {
		await handle(ctx.req, ctx.res);
    ctx.respond = false;
    ctx.res.statusCode = 200;
  };

	router.get("/", async (ctx) => {
    const shop = ctx.query.shop;

    if (ACTIVE_SHOPIFY_SHOPS[shop] === undefined) {
      ctx.redirect(`/auth?shop=${shop}`);
    } else {
			nextApp.render(ctx.req, ctx.res, '/')
			ctx.respond = false;
    	ctx.res.statusCode = 200;
    }
  });

	router.get("(/_next/static/.*)", handleRequest);
  router.get("/_next/webpack-hmr", handleRequest);
	router.get('(.*)', verifyRequest, handleRequest);
	
	server.use(router.routes());
	server.use(router.allowedMethods());

	// You can listen to global events to get notified when jobs are processed
	workQueue.on('global:completed', (jobId, result) => {
	  console.log(`Job ${jobId} completed with result ${result}`);
	});


	server.listen(port, () => {
		console.log(`> Ready on http://localhost:${port}`);
	})
});
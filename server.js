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
const ShopifyAdmin = require('./lib/shopify');

dotenv.config();
const port = parseInt(process.env.PORT, 10) || 3000;
const dev = process.env.NODE_ENV !== 'production';
const nextApp = next({ dev });
const handle = nextApp.getRequestHandler();

// Create a new instance of the custom storage class
const store = new RedisStore();


// initializes the library
Shopify.Context.initialize({
  API_KEY: process.env.SHOPIFY_API_KEY,
  API_SECRET_KEY: process.env.SHOPIFY_API_SECRET,
  SCOPES: process.env.SHOPIFY_APP_SCOPES,
  HOST_NAME: process.env.SHOPIFY_APP_URL.replace(/^https:\/\//, ''),
  API_VERSION: ApiVersion.October20,
  IS_EMBEDDED_APP: true,
  SESSION_STORAGE: new Shopify.Session.CustomSessionStorage(
    store.storeCallback,
    store.loadCallback,
    store.deleteCallback,
  ),
});

// Storing the currently active shops in memory will force them to re-login when your server restarts. You should
// persist this object in your app.
const ACTIVE_SHOPIFY_SHOPS = {};

// Create / Connect to a named work queue
const workQueue = new Queue('critical-css', process.env.REDIS_URL, { redis: { 
	tls: { rejectUnauthorized: false }
}});

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
      const registration = await Shopify.Webhooks.Registry.register({
        shop,
        accessToken,
        path: "/webhooks",
        topic: "APP_UNINSTALLED",
        webhookHandler: async (topic, shop, body) => { 
					console.log('APP_UNINSTALLED');
					delete ACTIVE_SHOPIFY_SHOPS[shop];
				},
      });

			if (!registration.success) {
        console.log(
          `Failed to register APP_UNINSTALLED webhook: ${registration.result}`
        );
      }

			// Check if a charge has been made for this shop
			const paid = await store.getAsync(shop);
			const returnUrl = `https://${shop}/admin/apps/critical-css?shop=${shop}`;
			if(!paid) {
				const subscriptionUrl = await getSubscriptionUrl(accessToken, shop, returnUrl);
				ctx.redirect(subscriptionUrl);
				return;
			}
			ctx.redirect(returnUrl);
		}
	}))
	
	const router = new Router();

	router.post('/webhooks', async (ctx) => {
		await Shopify.Webhooks.Registry.process(ctx.req, ctx.res);
		console.log(`Webhook processed with status code 200`);
	});


	// Turn on critical css
	router.get('/generate', async (ctx) => {
		try {
			const session = await Shopify.Utils.loadCurrentSession(ctx.req, ctx.res, true);
			if(!session) {
				ctx.body = JSON.stringify({ error: "could not find session" });
				return;
			}
			console.log(`/generate for ${session.shop} with access token: ${session.accessToken}`)
			const job = await workQueue.add({
				type: 'generate',
				shop: session.shop,
				accessToken: session.accessToken
			});
			console.log(`created job ${job.id}`);
			ctx.body = JSON.stringify({ id: job.id });
		} catch(e) {
			console.log(e);
			ctx.body = JSON.stringify({ error: "could not find session" });
		}
	});

	// Turn off critical css
	router.get('/restore', async (ctx) => {
		try {
			const session = await Shopify.Utils.loadCurrentSession(ctx.req, ctx.res, true);
			if(!session) {
				ctx.body = JSON.stringify({ error: "could not find session" });
				return;
			}
			const job = await workQueue.add({
				type: 'restore',
				shop: session.shop,
				accessToken: session.accessToken,
			});
			console.log(`created job ${job.id}`);
			ctx.body = JSON.stringify({ id: job.id });
		} catch(e) {
			console.log(e);
			ctx.body = JSON.stringify({ error: "could not find session" });
		}
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
			ctx.body = JSON.stringify({
				id, 
				state, 
				progress, 
				reason, 
				type: job.data.type,
				result: job.data.result
			});
		}
	});

	const handleRequest = async (ctx) => {
		await handle(ctx.req, ctx.res);
    ctx.respond = false;
    ctx.res.statusCode = 200;
  };

	// store the charge id for a shop that's paid the fee
	router.get('/store-paid', async ctx => {
		const session = await Shopify.Utils.loadCurrentSession(ctx.req, ctx.res, true);
		const charge_id = ctx.query.charge_id;

		const shopifyAdmin = new ShopifyAdmin({
			accessToken: session.accessToken,
			shop: session.shop,
			version: '2021-04'
		})
		await shopifyAdmin.init();
		const themeLiquid = await shopifyAdmin.getThemeLiquid();

		if(session && charge_id) {
			const paid = await store.setAsync(session.shop, JSON.stringify({ charge_id, timestamp: new Date(), originalTheme: themeLiquid.value }));
			if(paid == 'OK') {
				ctx.body = JSON.stringify({ success: true });
				return;
			}
			ctx.body = JSON.stringify({ success: false });
		}
	})

	// has a shop paid the fee?
	router.get('/paid', async ctx => {
		const session = await Shopify.Utils.loadCurrentSession(ctx.req, ctx.res, true);
		if(session) {
			const paid = await store.getAsync(session.shop);
			if(paid) {
				ctx.body = JSON.stringify({ success: true });
				return;
			}
			ctx.body = JSON.stringify({ success: false });
			return;
		}
		ctx.body = JSON.stringify({error: "Could not load current session"});
	})

	// Load main app
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
	workQueue.on('global:completed', async (jobId, result) => {
		let job = await workQueue.getJob(jobId);
		if (job !== null) {
			job.update({
				...job.data,
				result: result
			});
		}
	  console.log(`Job ${jobId} completed with result ${result}`);
	});


	server.listen(port, () => {
		console.log(`> Ready on http://localhost:${port}`);
	})
});
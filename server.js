require('isomorphic-fetch');
const dotenv = require('dotenv');
const Koa = require('koa');
const Router = require('koa-router');
const next = require('next');
const { default: createShopifyAuth } = require('@shopify/koa-shopify-auth');
const { verifyRequest } = require('@shopify/koa-shopify-auth');
const session = require('koa-session');
const generate = require('./routes/generate');
const socket = require('socket.io');
const eventEmitter = require('./lib/events')

dotenv.config();

const port = parseInt(process.env.PORT, 10) || 3000;
const dev = process.env.NODE_ENV !== 'production';
const nextApp = next({ dev });
const handle = nextApp.getRequestHandler();
const { SHOPIFY_API_KEY, SHOPIFY_API_SECRET_KEY } = process.env;

nextApp.prepare().then(() => {
	const koaServer = new Koa();
	const router = new Router();
	const server = require('http').createServer(koaServer.callback());
	const io = socket(server);

	koaServer.use(session({ secure: true, sameSite: 'none' }, koaServer));
	koaServer.keys = [SHOPIFY_API_SECRET_KEY];
	koaServer.use(createShopifyAuth({
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

	koaServer.use(verifyRequest());
	router.get('/generate', generate);

	koaServer.use(router.routes());
	koaServer.use(router.allowedMethods());
	
	
	koaServer.use(async(ctx) => {
		await handle(ctx.req, ctx.res);
		ctx.respond = false;
		ctx.res.statusCode = 200;
		return;
	})

	
	io.on('connection', socket => {
		// This doesn't work as multiple event listeners get added for each socket,
		// so the response will get sent to everyone at the same time.
		eventEmitter.on('critical-css', msg => {
			socket.emit('critical-css', msg)
		})
		console.log(socket.server);

		console.log('a user connected');
	})

	server.listen(port, () => {
		console.log(`> Ready on http://localhost:${port}`);
	})
});
require('isomorphic-fetch');
const dotenv = require('dotenv');
const Koa = require('koa');
const Router = require('koa-router');
const next = require('next');
const { default: createShopifyAuth } = require('@shopify/koa-shopify-auth');
const { verifyRequest } = require('@shopify/koa-shopify-auth');
const session = require('koa-session');
const generate = require('./routes/generate');

dotenv.config();

const port = parseInt(process.env.PORT, 10) || 3000;
const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();
const { SHOPIFY_API_KEY, SHOPIFY_API_SECRET_KEY } = process.env;

app.prepare().then(() => {
	const server = new Koa();
	const router = new Router();

	server.use(session({ secure: true, sameSite: 'none' }, server));
	server.keys = [SHOPIFY_API_SECRET_KEY];
	server.use(createShopifyAuth({
		apiKey: SHOPIFY_API_KEY,
		secret: SHOPIFY_API_SECRET_KEY,
		scopes: ['read_themes', 'write_themes'],
		afterAuth(ctx) {
			const { shop, accessToken } = ctx.session;
			console.log(`Authenticated for ${shop} with token: ${accessToken}`)
			ctx.token = accessToken;
			ctx.redirect(`https://${shop}/admin/apps/critical-css`)
		}
	}))

	server.use(verifyRequest());
	router.get('/generate', generate);

	server.use(router.routes());
	server.use(router.allowedMethods());
	
	
	server.use(async(ctx) => {
		await handle(ctx.req, ctx.res);
		ctx.respond = false;
		ctx.res.statusCode = 200;
		return;
	})

	server.listen(port, () => {
		console.log(`> Ready on http://localhost:${port}`);
	})
});
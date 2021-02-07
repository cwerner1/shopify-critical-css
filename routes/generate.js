let Queue = require('bull');

// Connect to a local redis intance locally, and the Heroku-provided URL in production
let REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

// Create / Connect to a named work queue
let workQueue = new Queue('critical-css', REDIS_URL);

module.exports = async (ctx, next) => {
	console.log('access token: ', ctx.session.accessToken)
	console.log('shop: ', ctx.session.shop)
	let job = await workQueue.add({
		shop: ctx.session.shop,
		accessToken: ctx.session.accessToken
	});

	ctx.body = JSON.stringify({ id: job.id });
}
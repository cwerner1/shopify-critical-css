const { fork } = require('child_process');

module.exports = async (ctx, next) => {
	console.log('access token: ', ctx.session.accessToken)
	console.log('shop: ', ctx.session.shop)

	const processCritical = fork('lib/processCriticalCss.js', ['--shop', ctx.session.shop, '--accessToken', ctx.session.accessToken]);
	processCritical.send('start');
	processCritical.on('message', msg => {
		// send message to client via firebase cloud messaging
	});

	ctx.body = JSON.stringify({ status: 'pending'});
}
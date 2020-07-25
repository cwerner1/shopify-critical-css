const { fork } = require('child_process');
const eventEmitter = require('../lib/events');

module.exports = async (ctx, next) => {
	console.log('access token: ', ctx.session.accessToken)
	console.log('shop: ', ctx.session.shop)

	const processCritical = fork('lib/processCriticalCss.js', ['--shop', ctx.session.shop, '--accessToken', ctx.session.accessToken]);
	processCritical.send('start');
	processCritical.on('message', msg => {
		// Socket.io picks this up in server.js and sends a message letting the
		// client know the status of the critical css job
		eventEmitter.emit('critical-css', msg)
	})

	// Respond straight away with a pending status
	ctx.body = JSON.stringify({
		status: 'pending'
	 });
}
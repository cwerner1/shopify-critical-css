const { EventEmitter } = require('events');

const eventEmitter = new EventEmitter();

eventEmitter.on("done", event => {
	console.log('Done!', event);
});

module.exports = eventEmitter;
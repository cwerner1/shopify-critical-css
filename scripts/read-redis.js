const dotenv = require('dotenv');
const RedisStore = require('../lib/redis-store.js');
dotenv.config();
try {
	const client = new RedisStore();
	client.getAsync('xxxxx.myshopify.com').then(value => console.log(value));
} catch(e) {
	console.log(e);
}

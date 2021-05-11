const dotenv = require('dotenv');
const RedisStore = require('../lib/redis-store.js');
dotenv.config();
try {
	const client = new RedisStore();
	client.setAsync('xxxxx.myshopify.com', JSON.stringify({ charge_id: "manual", timestamp: new Date() })).then(value => console.log(value));
} catch(e) {
	console.log(e);
}

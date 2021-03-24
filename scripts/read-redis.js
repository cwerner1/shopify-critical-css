const dotenv = require('dotenv');
const RedisStore = require('../lib/redis-store.js');
dotenv.config();
const client = new RedisStore();
client.getAsync('dev-1987.myshopify.com').then(value => console.log(value));


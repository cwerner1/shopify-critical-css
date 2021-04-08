const { generateForShop } = require("../lib/critical-css");
const fs = require("fs");

process.env.TIMEOUT = 1000;
process.env.CRITICAL_CSS_CONCURRENCY = 1;

const shopUrls = [];

generateForShop(
	'',
	{ progress: () => null }, 
	criticalCSs => {
		fs.writeFileSync('test.txt', criticalCSs)
		const memUsed = process.memoryUsage().heapUsed / 1024 / 1024;
		console.log(`Process used: ${memUsed}MB`);
	},
	shopUrls
);

console.log()



const { generateForShop } = require("../lib/critical-css");
const fs = require("fs");

process.env.TIMEOUT = 300000;
process.env.CRITICAL_CSS_CONCURRENCY = 1;

generateForShop('', { progress: () => null }, shopUrls)
  .then(criticalCSs => {
		fs.writeFileSync('test.txt', criticalCSs)
		const memUsed = process.memoryUsage().heapUsed / 1024 / 1024;
		console.log(`Process used: ${memUsed}MB`);
	});


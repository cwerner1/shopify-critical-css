const { generateForShop } = require("../lib/critical-css");
const fs = require("fs");
const ShopifyAdmin = require("../lib/shopify");

process.env.TIMEOUT = 300000;
process.env.CRITICAL_CSS_CONCURRENCY = 1;

const shopUrls = [
   { type: 'index', url: 'https://hairstreaq.myshopify.com/' },
   {
     type: 'list-collections',
     url: 'https://hairstreaq.myshopify.com/collections'
   },
  //  {
  //    type: 'product',
  //    url: 'https://hairstreaq.myshopify.com/products/2bundle-hairstreaq-detangling-brushes'
  //  },
   {
     type: 'search',
     url: 'https://hairstreaq.myshopify.com/search?q=2+- Hairstreaq Detangling Brushes'
   },
   {
     type: 'collection',
     url: 'https://hairstreaq.myshopify.com/collections/frontpage'
   },
   {
     type: 'page',
     url: 'https://hairstreaq.myshopify.com/pages/contact-us'
   },
   { type: 'blog', url: 'https://hairstreaq.myshopify.com/blogs/news' }
 ]

generateForShop(ShopifyAdmin, { progress: () => null }, shopUrls)
  .then(criticalCSs => {
		fs.writeFileSync('test.txt', criticalCSs)
		const memUsed = process.memoryUsage().heapUsed / 1024 / 1024;
		console.log(`Process used: ${memUsed}MB`);
	});


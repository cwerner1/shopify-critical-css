const { generateForShop } = require("../lib/critical-css");
const fs = require("fs");

process.env.TIMEOUT = 300000;

const shopUrls = [
  { type: 'index', url: 'https://twig-plants-and-pots.myshopify.com/' },
  {
    type: 'list-collections',
    url: 'https://twig-plants-and-pots.myshopify.com/collections'
  },
  {
    type: 'product',
    url: 'https://twig-plants-and-pots.myshopify.com/products/lipstick-plant'
  },
  {
    type: 'search',
    url: 'https://twig-plants-and-pots.myshopify.com/search?q=Aeschynathus+Rasta'
  },
  {
    type: 'page',
    url: 'https://twig-plants-and-pots.myshopify.com/pages/christmas-order-dates-2020'
  },
  {
    type: 'blog',
    url: 'https://twig-plants-and-pots.myshopify.com/blogs/blog'
  },
  {
    type: 'article',
    url: 'https://twig-plants-and-pots.myshopify.com/blogs/blog/my-first-shop-in-bristol'
  }
]

generateForShop(
	'twig-plants-and-pots.myshopify.com',
	{ progress: () => null }, 
	criticalCSs => {
		fs.writeFileSync('test.txt', criticalCSs)
		const memUsed = process.memoryUsage().heapUsed / 1024 / 1024;
		console.log(`Process used: ${memUsed}MB`);
	},
	shopUrls
);

console.log()



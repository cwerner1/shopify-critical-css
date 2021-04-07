// Get the URLs for all the different types of pages on the shop
module.exports = async (shopifyAdmin) => {
	const shopUrls = [
		{
			type: 'index',
			url: `https://${shopifyAdmin.shop}/`
		},
		{
			type: 'list-collections',
			url: `https://${shopifyAdmin.shop}/collections`
		},
	];

	try {
		const data = await Promise.all([
			shopifyAdmin.fetch('products.json?limit=1'),
			shopifyAdmin.fetch('custom_collections.json?limit=1'),
			shopifyAdmin.fetch('pages.json?limit=1'),
			shopifyAdmin.fetch('blogs.json?limit=1'),
		]);
		const products = data[0].products;
		const collections = data[1].custom_collections;
		const pages = data[2].pages;
		const blogs = data[3].blogs;

		// Product
		if(products.length === 1) {
			shopUrls.push({
				type: 'product',
				url: `https://${shopifyAdmin.shop}/products/${products[0].handle}`
			});
			shopUrls.push({
				type: 'search',
				url: `https://${shopifyAdmin.shop}/search?q=${products[0].title.replace(' ', '+')}`
			})

		}

		// Collection
		if(collections.length === 1) {
			shopUrls.push({
				type: 'collection',
				url: `https://${shopifyAdmin.shop}/collections/${collections[0].handle}`
			})
		}

		// Page
		if(pages.length === 1) {
			shopUrls.push({
				type: 'page',
				url: `https://${shopifyAdmin.shop}/pages/${pages[0].handle}`
			})
		}
		
		// Blog
		if(blogs.length === 1) {
			shopUrls.push({
				type: 'blog',
				url: `https://${shopifyAdmin.shop}/blogs/${blogs[0].handle}`
			})
			// Article
			const res = await shopifyAdmin.fetch(`/blogs/${blogs[0].id}/articles.json?limit=1&published_status=published`);
			if(res.articles.length === 1) {
				shopUrls.push({
					type: 'article',
					url: `https://${shopifyAdmin.shop}/blogs/${blogs[0].handle}/${res.articles[0].handle}`
				})
			}
		}
		console.log('URLs:', shopUrls);
		return shopUrls;
	} catch(e) {
		throw new Error('Failed to get one or more shop URLs', e);
	}
	
}
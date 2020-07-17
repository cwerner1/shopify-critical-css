module.exports = async (ctx, next) => {
	try {
		const adminRes = await fetch('https://dev-1987.myshopify.com/admin/api/2020-04/themes.json', {
			headers: {
				'X-Shopify-Access-Token': ctx.session.accessToken
			}
		}).then(res => res.json());
		ctx.body = JSON.stringify({ adminRes: adminRes });
	}
	catch(e) {
		console.log(e);
		ctx.response.status = 400
	}
}
class ShopifyAdmin {
	constructor({ shop, accessToken, version }) {
		if(!shop || !accessToken || !version) {
			throw new Error('Cannot initialise ShopifyAdmin. Required parameter missing');
		}
		this.shop = shop;
		this.accessToken = accessToken;
		this.assets = {};
		this.version = version
		this.url = `https://${this.shop}/admin/api/${this.version}`;
	}

	fetch(endpoint, method = 'GET', data = null) {
		const options = {
			headers: {
				'X-Shopify-Access-Token': this.accessToken
			}
		}
		if(method === 'PUT' && data) {
			options.headers['Content-Type'] = 'application/json';
			options.body = JSON.stringify(data);
		};
		return fetch(`${this.url}/${endpoint}`, options).then(res => res.json());
	}

	async init() {
		try {
			const themesRes = await fetch(`${this.url}/themes.json`, {
				headers: {
					'X-Shopify-Access-Token': this.accessToken
				}
			}).then(res => res.json());

			const mainThemeArr = themesRes.themes.filter(t => t.role === 'main');
			const mainTheme = mainThemeArr.length === 1 ? mainThemeArr[0] : null;

			if(!mainTheme) {
				throw new Error('Could not get current theme id', e)
			}

			this.themeId =  mainTheme.id;

		} catch(e) {
			throw new Error('Could not get current theme id', e)
		}
	}

	async getThemeLiquid() {
		if (this.assets.theme) {
			return this.assets.theme;
		}

		try {
			console.log(`${this.url}/themes/${this.themeId}/assets.json?asset[key]=layout/theme.liquid`);
			console.log('access token: ', this.accessToken);
			const themeLiquid = await fetch(`${this.url}/themes/${this.themeId}/assets.json?asset[key]=layout/theme.liquid`, {
					headers: {
						'X-Shopify-Access-Token': this.accessToken
					}
				}).then(res => res.json());
				
			this.assets.theme = themeLiquid.asset;
			return this.assets.theme;
		} 
		catch(e) {
			throw new Error('Could not get theme.liquid', e)
		}
	}


	async writeAsset({name, value}) {
		try {
			await fetch(`${this.url}/themes/${this.themeId}/assets.json`, {
				method: 'PUT',		
				headers: {
					'Content-Type': 'application/json',
					'X-Shopify-Access-Token': this.accessToken
				},
				body: JSON.stringify({
					asset: {
						key: name,
						value: value
					}
				})

			}).then(res => res.json());
			return true;
		} 
		catch(e) {
			new Error('Could not write asset', e);
		}
	}
}

module.exports = ShopifyAdmin;
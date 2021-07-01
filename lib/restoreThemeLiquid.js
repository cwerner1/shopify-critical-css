module.exports = async (html, redisStore, shop) => {
	let shopDb = {};
	try {
		shopDb = JSON.parse(await redisStore.getAsync(shop));
	} catch (e) {
		console.log(e);
	}

	// If a backup of the theme.liquid html was found, restore from there
	if(shopDb.originalTheme) {
		console.log("returning from original theme from redis", shopDb.originalTheme);
		return shopDb.originalTheme
	}

	// Otherwise remvove critical css from theme.liquid
	
	// Remove the critical css from theme.liquid
	const withoutCriticalCss = html
		.replace("\n  {% include 'critical-css.liquid' %}", "")
		.replace("\n  {% include 'critical-css' %}", "")
		.replace("\n  {% render 'critical-css' %}", "");

	// Find all liquid stylesheets: {{ 'theme.scss.css' | asset_url | stylesheet_tag }}
	const linkTagRegex = /<link.+rel="stylesheet".+?>/g;
	const withLinkTagsReplaced = withoutCriticalCss.replace(linkTagRegex, match => {
		const hrefMatches = match.trim().match(/<link\s+(?:[^>]*?\s+)?href=(["'])(.*?)\1/);
		if(hrefMatches.length === 3) {
			const assetUrl = hrefMatches[2];
			return `<link rel="stylesheet" href="${assetUrl}" media="all">`
		}
		return match;
	})
	
	return withLinkTagsReplaced
}
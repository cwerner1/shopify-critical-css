module.exports = html => {
	// Remove the critical css from theme.liquid
	const withoutCriticalCss = html.replace("\n  {% include 'critical-css.liquid' %}", "").replace("\n  {% include 'critical-css' %}", "");

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
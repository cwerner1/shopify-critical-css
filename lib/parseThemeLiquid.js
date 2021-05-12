// Need this for backwards compatibility. First version used {% include %} instead of {% render %}
function removeInclude(str) {
	return str.replace("\n  {% include 'critical-css' %}", "").replace("\n  {% include 'critical-css.liquid' %}", "");
}

module.exports = html => {
	// Already has critical css added
	const hasCriticalCss = html.search("{% render 'critical-css' %}");
	if(hasCriticalCss !== -1) {
		return html
	}

	// Find all liquid stylesheets: {{ 'theme.scss.css' | asset_url | stylesheet_tag }}
	const linkTagRegex = /<link.+rel="stylesheet".+?>/g;
	const withLinkTagsReplaced = html.replace(linkTagRegex, match => {
		const hrefMatches = match.trim().match(/<link\s+(?:[^>]*?\s+)?href=(["'])(.*?)\1/);
		if(hrefMatches.length === 3) {
			const assetUrl = hrefMatches[2];
			return `<link rel="stylesheet" href="${assetUrl}" as="style" media="none" onload="this.onload=null;this.media='all'">`
		}
		return match;
	})

	// Find all <link rel="stylesheet"> elements
	const styleTagRegex = /{{.+stylesheet_tag }+/g;
	const withStyleTagsReplaced = withLinkTagsReplaced.replace(styleTagRegex, match => {
		const assetUrl = match.trim().replace(' | stylesheet_tag', '');
		return `<link rel="stylesheet" href="${assetUrl}" as="style" media="none" onload="this.onload=null;this.media='all'">`
	})

	// render critical css
	const hasCharsetMeta = withStyleTagsReplaced.search(/<meta charset=("|')utf-8("|')>/);
	let withCriticalCss = '';
	if(hasCharsetMeta !== -1) {
		withCriticalCss = removeInclude(withStyleTagsReplaced.replace(/<meta charset=("|')utf-8("|')>/, "<meta charset='utf-8'>\n  {% render 'critical-css' %}"));
	}
	else {
		withCriticalCss = removeInclude(withStyleTagsReplaced.replace(/<head>/, "<head>\n  {% render 'critical-css' %}"));
	}
	
	return withCriticalCss
}
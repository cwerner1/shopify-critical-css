module.exports = html => {
	// Already has critical css added
	const hasCriticalCss = html.search('{{ include snippets/critical-css.liquid  }}');
	if(hasCriticalCss !== -1) {
		return html
	}

	// Find all liquid stylesheets: {{ 'theme.scss.css' | asset_url | stylesheet_tag }}
	const linkTagRegex = /<link.+rel="stylesheet".+/g;
	const withLinkTagsReplaced = html.replace(linkTagRegex, match => {
		const hrefMatches = match.trim().match(/<link\s+(?:[^>]*?\s+)?href=(["'])(.*?)\1/);
		if(hrefMatches.length === 3) {
			const assetUrl = hrefMatches[2];
			return `<link rel="stylesheet" href="${assetUrl}" as="style" media="all" onload="this.onload=null;this.media='all'">`
		}
		return match;
	})

	// Find all <link rel="stylesheet"> elements
	const styleTagRegex = /{{.+stylesheet_tag }+/g;
	const withStyleTagsReplaced = withLinkTagsReplaced.replace(styleTagRegex, match => {
		const assetUrl = match.trim().replace(' | stylesheet_tag', '');
		return `<link rel="stylesheet" href="${assetUrl}" as="style" media="all" onload="this.onload=null;this.media='all'">`
	})

	// Include critical css
	const hasCharsetMeta = withStyleTagsReplaced.search(/<meta charset="utf-8">/);
	let withCriticalCss = '';
	if(hasCharsetMeta !== -1) {
		withCriticalCss = withStyleTagsReplaced.replace(/<meta charset="utf-8">/, '<meta charset="utf-8">\n  {{ include snippets/critical-css.liquid }}');	
	}
	else {
		withCriticalCss = withStyleTagsReplaced.replace(/<head>/, '<head>\n  {{ include snippets/critical-css.liquid }}');
	}
	
	return withCriticalCss
}
export function getQueryVariable(query, variable) {
	var cleanQuery = query.substr(query.indexOf('?')+1);
	var vars = cleanQuery.split('&');
	for (var i = 0; i < vars.length; i++) {
			var pair = vars[i].split('=');
			if (decodeURIComponent(pair[0]) == variable) {
					return decodeURIComponent(pair[1]);
			}
	}
}
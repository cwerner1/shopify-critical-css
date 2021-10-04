const critical = require('critical');

const dimensions = [{
	height: 640,	// moto G4
	width: 360
},
{
	height: 1024, // ipad
	width: 768
},
{
	height: 750, // macbook pro(ish)
	width: 1200
}];

function generate(pageUrl) {
	console.log(`Generating critical css for url: ${pageUrl}...`)
	return critical.generate({
		src: pageUrl,
		dimensions: dimensions,
		extract: true,
		minify: true,
		ignore: {
			atrule: ['@font-face', '@keyframes', '@-moz-keyframes', '@-webkit-keyframes'],
			decl: (node, value) => /url\(/.test(value),
		},
		penthouse: {
			timeout: 60000
		}
	}).then(({css, html}) => {
		console.log(css);
		return {
			type: shopUrl.type,
			css: css
		}
	}).catch(e => {
		console.log(e);
	})
}

generate('url here');
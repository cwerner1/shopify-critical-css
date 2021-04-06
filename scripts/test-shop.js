const { generateForPage } = require("../lib/critical-css");
const fs = require ('fs');

generateForPage({
	url:'',
	type: 'index'
}).then(res => {
	fs.writeFileSync('test.txt', res.css);
	console.log(res.css)
});

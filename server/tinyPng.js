const fs = require('fs');
const path = require('path');
const tinify = require("tinify");
tinify.key = "ji_oer2nT8KVdzjDftCr_LKnF-DS87Za";

const ENTRY =  path.resolve(__dirname, "../bin");
const OUTPUT =  ENTRY + "_tiny";


if (!fs.existsSync(OUTPUT)) fs.mkdirSync(OUTPUT);

fileDisplay(ENTRY); 

function fileDisplay(filePath) {
	fs.readdir(filePath, function(err, files) {
		if (err) return console.error(err);

		files.forEach(filename=> {
			var filedir = path.join(filePath, filename);
			fs.stat(filedir, function(eror, stats) {
				if (eror) return console.warn('获取文件stats失败');
				if (stats.isFile()) {
					if (/\.png$/i.test(filedir)) {
						tinyPng(filePath, filename);
					}
				} else if (stats.isDirectory()) {
					if (!/node_modules/.test(filedir)) {
						fileDisplay(filedir);
					}
				}
			});
		});
	});
} 


function tinyPng(filePath, filename) {
	var filedir = path.join(filePath, filename);
	var source = tinify.fromFile(filedir);
	let newdir = filedir.replace(ENTRY, OUTPUT);
	if (!fs.existsSync(newdir)) fs.mkdirSync(newdir);
	let newfiledir = newdir + "\\" + filename;
	source.toFile(newfiledir);
}
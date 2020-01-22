#!/usr/bin/env node
const path = require("path");
const glob = require("glob");
const fs = require("fs");
const spawn = require("child_process").spawn;
const os = require("os");
const template = require("art-template");

const UIParser = require("./gen/UIParser");

const pagePath = path.resolve(__dirname, "../laya/pages/");

(() => {
	const uiFiles = glob.sync('**/*.ui', {cwd: pagePath });
	const uiTpls = [];
	uiFiles.forEach(uiFile => {
		const parser = new UIParser({ pagePath });
		const data = parser.parse(uiFile);
		const uiTpl = template(__dirname + "/tpl/ui.art", data);
		uiTpls.push(uiTpl);
	});
	const uiMaxTpl = template(__dirname + "/tpl/ui-max.art", { tpls: uiTpls });
	fs.writeFileSync(path.resolve(__dirname, "../src/ui/layaUI.max.all.js"), uiMaxTpl);
})();





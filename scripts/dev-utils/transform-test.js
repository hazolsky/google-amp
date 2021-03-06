#!/usr/bin/env node

'use strict';

const fs = require('fs-promise');
const chalk = require('chalk');
const {clearScreen, cursorHide, cursorShow} = require('ansi-escapes');
const {highlight} = require('emphasize');
const {html: htmlBeautify} = require('js-beautify');
const monokai = require('@quarterto/emphasize-monokai-sheet');

const path = process.argv[2];

process.stdout.write(cursorHide);
process.on('exit', () => process.stdout.write(cursorShow));

const transformBody = require('../server/lib/transform-body');

fs.readFile(path, 'utf8')
	.then(transformBody)
	.then(html => {
		process.stdout.write(clearScreen);
		console.log(
			highlight(
				'html',
				htmlBeautify(html, {
					wrap_line_length: Math.floor(0.75 * process.stdout.columns),
					wrap_attributes: 'force',
				}),
				monokai
			).value
		);
	})
	.catch(e => console.error(`${chalk.red('✘')} ${e.stack || e.message || e}`));

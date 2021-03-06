#!/usr/bin/env node

'use strict';

const herokuMemoryLimit = require('@quarterto/heroku-memory-limit');

const limit = herokuMemoryLimit(18 / 32);
const flags = [
	'--optimize_for_size',
	'--gc_interval=100',
	'--max_semi_space_size=1',
	`--max_old_space_size=${limit}`,
].join(' ');

console.error(`Node flags: ${flags}`);
console.log(flags);

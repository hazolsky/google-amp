'use strict';
const fetchHead = require('./wrap-fetch.js')('get-stream-url', require('@quarterto/fetch-head'));

module.exports = (metadatum) => {
	const streamUrl = `http://www.ft.com/stream/${metadatum.taxonomy}Id/${metadatum.idV1}`;

	return fetchHead(streamUrl)
		.then(res => res.status >= 200 && res.status < 400 && streamUrl);
};

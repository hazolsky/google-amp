'use strict';

const elasticSearchUrl = process.env.ELASTIC_SEARCH_URL;
const tcpFetch = require('@quarterto/tcp-fetch');
const healthCheck = require('./check');

module.exports = healthCheck({
	id: 'elastic-search',
	name: 'Check TCP/IP connectivity to this app\'s configured Elastic Search hostname on port 443',
	businessImpact: 'Newly crawled FT articles will not have AMP versions ' +
		'of content available in e.g. the Google news carousel',
	technicalSummary: `Attempts to connect to ${elasticSearchUrl}:443. All ` +
		'content is requested from this host; without connectivity, when ft.com' +
		'is crawled, new content will not be available as AMP pages.',
	panicGuide: 'Check connectivity by running' +
		`\`heroku run --app ${process.env.HEROKU_APP_NAME} nc -w 5 -z ${elasticSearchUrl} 443.\``,
}, () => tcpFetch(elasticSearchUrl, 443)
	.then(
		ms => ({ok: true, checkOutput: ms}),
		err => ({ok: false, checkOutput: err})
	));

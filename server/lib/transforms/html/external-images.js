'use strict';

const {XmlEntities: entities} = require('html-entities');
const fetchres = require('fetchres');
const {STATUS_CODES: statusCodes} = require('http');
const url = require('url');
const reportError = require('../../report-error');
const Warning = require('../../warning');
const fetch = require('../../fetch/wrap')(require('node-fetch'));

const imageServiceUrl = (uri, {mode, width} = {}) => url.format({
	protocol: 'https',
	hostname: 'www.ft.com',
	pathname: `/__origami/service/image/v2/images/${mode}/${encodeURIComponent(uri)}`,
	query: Object.assign({
		source: 'google-amp',
		fit: 'scale-down',
	}, width ? {width} : {}),
});

// See Sass variables
const maxColumnWidth = 500;
const pagePadding = 10;
const minColumnWidth = 320 - (2 * pagePadding);

const maxAsideWidth = 470;

function getWidthAndRatio(metaUrl, options) {
	return fetch(metaUrl)
		.then(fetchres.json)
		.catch(err => {
			if(fetchres.originatedError(err)) {
				return Promise.reject(
					new Warning(
						`Failed to get image metadata for ${metaUrl}. ${err.message}: ${statusCodes[err.message]}`
					)
				);
			}

			return Promise.reject(err);
		})
		.then(
			meta => Object.assign(meta, {ratio: meta.height / meta.width}),
			e => {
				reportError(options.raven, e, {extra: {metaUrl}});
				return {width: maxColumnWidth, ratio: 4 / 7}; // discard error and use fallback dimensions
			}
		);
}

module.exports = ($, options) => Promise.all($('img[src]').map((i, el) => {
	const $el = $(el);
	const isAside = !!$el.parents('.n-content-related-box').length;
	const imageSrc = entities.decode($el.attr('src')).replace(
		/^(https?:\/\/ftalphaville.ft.com)?\/wp-content/,
		'https://ftalphaville-wp.ft.com/wp-content'
	)
		.replace('assanka_web_chat', 'wp-plugin-ft-web-chat');

	const ampImg = $('<amp-img>');
	const metaUrl = imageServiceUrl(imageSrc, {mode: 'metadata'});

	return getWidthAndRatio(metaUrl, options)
		.then(meta => {
			const width = Math.min(isAside ? maxAsideWidth : maxColumnWidth, meta.width);
			const height = width * meta.ratio;
			const src = imageServiceUrl(imageSrc, {mode: 'raw', width});

			ampImg.attr({
				width,
				height,
				src,
				alt: $el.attr('alt') || '',
				layout: 'responsive',
				'data-original-width': $el.attr('width'),
				'data-original-height': $el.attr('height'),
				'data-original-class': $el.attr('class'),
			});

			if(!isAside && width < minColumnWidth) {
				// don't stretch narrow inline images to page width
				ampImg.attr('layout', 'fixed');
			}

			$el.replaceWith(ampImg);
		});
}).toArray());

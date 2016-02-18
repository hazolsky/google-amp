const articleXsltTransform = require('../../bower_components/next-article/server/transforms/article-xslt');
const bodyTransform = require('../../bower_components/next-article/server/transforms/body');
const dateTransform = require('./article-date');
const summaryTransform = require('./article-summary');
const cheerio = require('cheerio');

function cheerioTransforms(transforms) {
	return function(article) {
		article.bodyHtml = transforms.reduce(
			($, transform) => (transform($) || $),
			cheerio.load(article.bodyHtml, {decodeEntities: false})
		).html();
		return article;
	};
}

function removeStyleAttributes($) {
	$('[style]').each(function() {
		$(this).removeAttr('style');
	});
}

function transformArticleBody(article) {
	let xsltParams = {
		id: article.id,
		webUrl: article.webUrl,
		renderTOC: 0,
		suggestedRead: 0,
		brightcoveAccountId: process.env.BRIGHTCOVE_ACCOUNT_ID,

		// See: https://github.com/ampproject/amphtml/blob/master/extensions/amp-brightcove/amp-brightcove.md#player-configuration
		// NB: Next don't use the native Brightcove player, so don't use this param. Default seems fine.
		// brightcovePlayerId: process.env.BRIGHTCOVE_PLAYER_ID
		brightcovePlayerId: 'default'
	};

	return articleXsltTransform(article.bodyXML, 'main', xsltParams)
		.then(articleBody => bodyTransform(articleBody, {}))
		.then(cheerioTransforms([removeStyleAttributes]));
}

module.exports = contentItem => transformArticleBody(contentItem)
	.then(transformedContent => {
		contentItem.htmlBody = transformedContent.bodyHtml;
		contentItem.mainImageHtml = transformedContent.mainImageHtml;
		contentItem.displayDate = dateTransform(contentItem);
		contentItem.displaySummary = summaryTransform(contentItem);
		return contentItem;
	});

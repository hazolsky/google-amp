'use strict';

const nEsClient = require('@financial-times/n-es-client');
const errors = require('http-errors');
const promiseAllObj = require('@quarterto/promise-all-object');
const addStoryPackage = require('../related-content/story-package');
const addMoreOns = require('../related-content/more-ons');
const articleFlags = require('../article/article-flags');
const transformArticle = require('../transforms/article');
const fetchSlideshows = require('../article/fetch-slideshows');
const transformSlideshows = require('../transforms/slideshows');
const isLiveBlog = require('../live-blogs/is-live-blog');
const getLiveBlog = require('../live-blogs/get-live-blog');

const reportError = require('../report-error');

const getCSS = require('./css');
const environmentOptions = require('./environment-options');
const handlebars = require('../handlebars');

const getAuthors = article => (article.byline || '').replace(/^by\s+/i, '');

const getByline = article => (article.authorConcepts || []).reduce(
	(byline, author) => byline.replace(author.prefLabel, `
		<a
			class="article-author-byline__author"
			href="${author.url}"
			data-vars-link-destination="${author.url}"
			data-vars-link-type="author-byline"
			data-vars-link-text="${author.prefLabel}">
			${author.prefLabel}
		</a>
	`),
	(article.byline || '').replace(/^by\s+/i, '')
);

const getMainImage = data => {
	if(data.mainImage) {
		return {
			url: data.mainImage.url,
			width: data.mainImage.width,
			height: data.mainImage.height,
		};
	} else {
		// Return a default logo image if an actual image is not available
		// TODO pull out the lead image from the body XML if possible
		return {
			url: 'http://im.ft-static.com/m/img/social/og-ft-logo-large.png',
			// https://developers.google.com/search/docs/data-types/articles - minimum width = 696px
			width: 696,
			height: 696,
		};
	}
};

const extraArticleData = (article, options) => promiseAllObj({
	authorList: getAuthors(article),
	byline: getByline(article, options),
	mainImage: getMainImage(article),
	css: getCSS(article, options),
}).then(extra => Object.assign(article, extra));

const assembleArticle = (uuid, options) => {
	options = Object.assign({}, environmentOptions, options);

	return nEsClient.get(uuid)
		.then(
			response => {
				if(response
					&& (!response.originatingParty || response.originatingParty === 'FT')
					&& (!response.type || response.type === 'article')
				) {
					return response;
				}

				throw new errors.NotFound(`Article ${uuid} not found`);
			},
			err => {
				if(err.status === 404) {
					throw new errors.NotFound(`Article ${uuid} not found`);
				}

				if(err.status) {
					reportError(options.raven, err);

					throw new errors.InternalServerError(`Elastic Search error fetching article ${uuid}`);
				}

				throw err;
			}
		)
		.then(article => articleFlags(article, options))
		.then(article => {
			if(article.enableLiveBlogs && isLiveBlog(article.webUrl)) {
				return getLiveBlog(article, options);
			}

			return article;
		})

		// First phase: network-dependent fetches and transforms in parallel
		.then(article => Promise.all([
			transformArticle(article, options),
			addStoryPackage(article, options),
			addMoreOns(article, options),
			fetchSlideshows(article, options),
		])

			// Second phase: transforms which rely on first phase fetches
			.then(() => Promise.all([
				transformSlideshows(article, options),
				extraArticleData(article, options),
			]))

			// Return the article
			.then(() => article));
};

module.exports = assembleArticle;
module.exports.render = (uuid, options) => assembleArticle(uuid, options)
	.then(article => handlebars.standalone().then(
		hbs => hbs.renderView('article', Object.assign({layout: 'layout'}, article))
	));

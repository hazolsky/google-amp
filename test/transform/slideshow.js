'use strict';

const {expect} = require('../../test-utils/chai');
const xslt = require('../../server/lib/article-xslt');

describe('slideshow transform', () => {
	it('should transform paragraphs that have a slideshow-looking link to ft-slideshow', async () => {
		expect(
			await xslt('<a href="http://www.ft.com/cms/s/ffffffff-ffff-ffff-ffff-ffffffffffff.html#slide0"></a>')
		).dom.to.equal('<ft-slideshow data-uuid="ffffffff-ffff-ffff-ffff-ffffffffffff"></ft-slideshow>');
	});

	it('should move non-slideshow content in a paragraph into its own paragraph', async () => {
		expect(
			await xslt(`<p>
				<a href="http://www.ft.com/cms/s/ffffffff-ffff-ffff-ffff-ffffffffffff.html#slide0"></a>
				hello
			</p>`)
		).dom.to.equal('<ft-slideshow data-uuid="ffffffff-ffff-ffff-ffff-ffffffffffff"></ft-slideshow><p>hello</p>');
	});
});

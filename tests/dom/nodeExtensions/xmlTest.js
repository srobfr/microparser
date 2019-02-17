const assert = require('assert');
const parserBuilder = new (require('../../../src/dom/ParserBuilder'))();
const debug = require('debug')('microparser:xmlTest');
const {tag} = require('../../../src/dom/helpers');

describe('Xml', function () {
    const parser = parserBuilder.build();

    it('Simple', function () {
        const g = tag('g', /^.+/);
        const $ = parser.parse(g, 'foo');
        assert.equal(`<g>foo</g>`, $.xml());
    });

    it('Xml escaping', function () {
        const g = tag('g', /^.+/);
        const $ = parser.parse(g, 'f<o>o&bar');
        assert.equal(`<g>f&lt;o&gt;o&amp;bar</g>`, $.xml());
    });
});

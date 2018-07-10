const assert = require('assert');
const parserBuilder = new (require('../../src/dom/ParserBuilder'))();
const debug = require('debug')('microparser:helpersTest');
const util = require('util');
const {or, multiple, optional, tag} = require('../../src/dom/helpers');

describe('Node', function () {
    const parser = parserBuilder.build();

    describe('xml', function () {
        it('Simple', function() {
            const ow = optional(/^\s+/);
            const separator = tag('separator', [ow, ',', ow]);
            const g = tag('g', [tag('a', 'a'), separator, tag('b', 'b')]);
            const $ = parser.parse(g, 'a, b');
            assert.equal(`<g><a>a</a><separator>, </separator><b>b</b></g>`, $.xml());
        });
    });
});

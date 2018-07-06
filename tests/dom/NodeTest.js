const assert = require('assert');
const parserBuilder = new (require('../../src/dom/ParserBuilder'))();
const debug = require('debug')('microparser:helpersTest');
const util = require('util');
const {or, multiple, optional, tag} = require('../../src/dom/helpers');

describe('Node', function () {
    const parser = parserBuilder.build();

    describe('xml', function () {
        it('Simple', function() {
            const a = tag('a', 'a');
            const ow = tag('ow', optional(/^\s+/));
            const separator = [ow, ',', ow];
            const aList = [a, optional([separator, a])];

            const $ = parser.parse(aList, 'a,a');
            assert.equal(`<or>bar</or>`, $.xml());
        });
    });
});

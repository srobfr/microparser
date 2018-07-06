const assert = require('assert');
const parserBuilder = new (require('../../src/dom/ParserBuilder'))();
const debug = require('debug')('microparser:helpersTest');
const util = require('util');
const {or, multiple, optional, tag} = require('../../src/dom/helpers');

describe('Node', function () {
    const parser = parserBuilder.build();

    describe.only('xml', function () {
        it('Simple', function() {
            const ow = optional(/^\s+/);

            const g = ['a', ow, ',', ow, 'b'];
            const $ = parser.parse(g, 'a,,,,b');
            assert.equal(`<or>bar</or>`, $.xml());
        });
    });
});

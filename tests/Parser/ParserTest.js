const assert = require('assert');
const Parser = require('../../src/Parser/Parser');
const debug = require('debug')('microparser:parserTest');

describe('Parser', function () {
    const parser = new Parser();

    it('Dev', function () {
        const result = parser.parse({or: ['Foo', 'Bar']}, 'Foo');
        debug(result);
    });
});

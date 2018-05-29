const assert = require('assert');
const Parser = require('../../src/Parser/Parser');
const debug = require('debug')('microparser:parserTest');

describe('Parser', function () {
    const parser = new Parser();

    it('Simple', function () {
        const result = parser.parse([['A'], 'B', 'C'], 'ABC');
        debug(result);
    });

    it('Or', function () {
        const result = parser.parse(['A', {or: ['B', 'C']}, 'D'], 'ACD');
        debug(result);
    });

    it('Ambiguous', function () {
        const result = parser.parse(['A', {or: ['B', 'B']}, 'C'], 'ABC');
        debug(result);
    });

    it('Addition', function () {
        const v = /^\d+/;
        const expr = {or: [v]};
        const sum = [expr, '+', expr];
        expr.or.push(sum);

        const result = parser.parse(expr, '1+2+3+4+5+6+7+8');
        debug(result);
    });
});

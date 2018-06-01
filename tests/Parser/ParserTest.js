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

    const v = /^\d+/;
    const expr = {or: [v]};
    const sum = [expr, '+', expr];
    expr.or.push(sum);

    it('Too short', function () {
        assert.throws(() => {
            const result = parser.parse(expr, '1+');
            debug(result);
        }, /Syntax error on line 1, column 3:/);
    });

    it('Too long', function () {
        assert.throws(() => {
            const result = parser.parse(['A', 'B'], 'ABC');
            debug(result);
        }, /Syntax error on line 1, column 3:/);
    });

    it('Addition', function () {
        const result = parser.parse(expr, '1+2');
        debug(result);
    });
});

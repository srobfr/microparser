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

    describe('Simple Expression', function () {
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

    describe('Ambiguous grammar', function () {
        const numeric = /^\d+/;
        numeric.tag = 'numeric';
        const expr = {or: [numeric]};
        expr.tag = 'expr';
        const mult = [expr, '*', expr];
        mult.tag = 'mult';
        const sum = [expr, '+', expr];
        sum.tag = 'sum';
        expr.or.push(mult, sum);

        it('Right to left', function () {
            const result = parser.parse(expr, '1+2*3');
            debug(result);
        });
        it('Left to right', function () {
            const result = parser.parse(expr, '1*2+3');
            debug(result);
        });
    });

    it('WIP', function () {
        const A = ['A'];
        A.tag = 'a';

        const result = parser.parse(A, 'A');
        debug(result);
    });
});

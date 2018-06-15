const assert = require('assert');
const ParseTableBuilder = require('../../src/ParseTable/ParseTableBuilder');
const ParseTable = require('../../src/ParseTable/ParseTable');
const debug = require('debug')('microparser:parseTableBuilderTest');

describe('ParseTableBuilder', function () {
    const parseTableBuilder = new ParseTableBuilder();

    it('Scalar', function () {
        const parseTable = parseTableBuilder.build('A');
        // debug(parseTable);
        assert(parseTable instanceof ParseTable);
        assert(parseTable.topSymbol instanceof String);
        assert.equal(parseTable.topSymbol.valueOf(), 'A');
        assert.equal(parseTable.firstSymbols.length, 1);
        assert.equal(parseTable.firstSymbols[0].valueOf(), 'A');
        assert.equal(parseTable.transitions.size, 0);
        assert.equal(parseTable.reductions.size, 0);
    });

    describe('Sequence', function () {
        it.only('Start recursion', function () {
            const g = ['A'];
            g.unshift(g); // g = [g, 'A'];
            const parseTable = parseTableBuilder.build(g);
            debug(parseTable);
            assert.equal(parseTable.transitions.size, 1);
            const transitions = parseTable.transitions.values().next().value;
            assert.equal(transitions.size, 1);
            assert.equal(parseTable.reductions.size, 1);
        });

        it('End recursion', function () {
            const g = ['A'];
            g.push(g); // g = ['A', g];
            const parseTable = parseTableBuilder.build(g);
            // debug(parseTable);
            assert.equal(parseTable.transitions.size, 1);
            const transitions = parseTable.transitions.values().next().value;
            assert.equal(transitions.size, 1);
            assert.equal(parseTable.reductions.size, 1);
        });

        it('Middle recursion', function () {
            const g = ['A'];
            g.push(g, 'B'); // g = ['A', g, 'B'];
            const parseTable = parseTableBuilder.build(g);
            // debug(parseTable);
            assert.equal(parseTable.transitions.size, 2);
            const transitions = parseTable.transitions.values().next().value;
            assert.equal(transitions.size, 1);
            assert.equal(parseTable.reductions.size, 1);
        });

        it('Start & End', function () {
            assert.throws(() => {
                const g = ['A'];
                g.unshift(g);
                g.push(g); // g = [g, 'A', g];
                const parseTable = parseTableBuilder.build(g);
                debug(parseTable);
                assert.equal(parseTable.transitions.size, 1);
                assert.equal(parseTable.reductions.size, 1);
            });
        });
    });

    describe('Or', function () {
        it('Simple', function () {
            const g = {or: ['A']};
            const parseTable = parseTableBuilder.build(g);
            // debug(parseTable);
            assert.equal(parseTable.transitions.size, 0);
            assert.equal(parseTable.reductions.size, 1);
        });

        it('Multiple', function () {
            const g = {or: ['A', 'B', 'C']};
            const parseTable = parseTableBuilder.build(g);
            // debug(parseTable);
            assert.equal(parseTable.transitions.size, 0);
            assert.equal(parseTable.reductions.size, 3);
        });

        it('Deep', function () {
            const g = {or: ['A', 'B', {or: ['C', 'D']}]};
            const parseTable = parseTableBuilder.build(g);
            // debug(parseTable);
            assert.equal(parseTable.firstSymbols.length, 4);
            assert.equal(parseTable.transitions.size, 0);
            assert.equal(parseTable.reductions.size, 5);
        });

        it('No terminal', function () {
            assert.throws(() => {
                const g = [];
                g.push(g);
                parseTableBuilder.build(g);
            });
        });

        it('Recursive', function () {
            assert.throws(() => {
                const g = {or: []};
                g.or.push(g);
                const parseTable = parseTableBuilder.build(g);
                // debug(parseTable);
                assert.equal(parseTable.firstSymbols.length, 1);
                assert.equal(parseTable.transitions.size, 0);
                assert.equal(parseTable.reductions.size, 1);
            });
        });

        it('Recursive start with content', function () {
            const g = {or: ['A']};
            g.or.push(g);
            const parseTable = parseTableBuilder.build(g);
            debug(parseTable);
            assert.equal(parseTable.firstSymbols.length, 1);
            assert.equal(parseTable.transitions.size, 0);
            assert.equal(parseTable.reductions.size, 2);
        });

        it('Recursive end with content', function () {
            const g = {or: ['A']};
            g.or.unshift(g);
            const parseTable = parseTableBuilder.build(g);
            debug(parseTable);
            assert.equal(parseTable.firstSymbols.length, 1);
            assert.equal(parseTable.transitions.size, 0);
            assert.equal(parseTable.reductions.size, 2);
        });

        it('Empty Or', function () {
            const g = {or: []};
            const parseTable = parseTableBuilder.build(g);
            // debug(parseTable);
            assert.equal(parseTable.firstSymbols.length, 1);
            assert.equal(parseTable.transitions.size, 0);
            assert.equal(parseTable.reductions.size, 1);
        });
    });

    describe('Special cases', function () {
        it('Or+Sequence', function () {
            const parseTable = parseTableBuilder.build(['A', {or: ['B', 'C']}, 'D']);
            // debug(parseTable);
            assert.equal(parseTable.firstSymbols.length, 1);
            assert.equal(parseTable.transitions.size, 3);
            assert.equal(parseTable.reductions.size, 3);
        });

        it('Recursion with exit', function () {
            const g = ['A'];
            const o = {or: [g, 'End']};
            g.push(o); // g = ['A', {or: [g, 'End']}]

            const parseTable = parseTableBuilder.build(g);
            debug(parseTable);
        });

        it('Empty sequence Start', function () {
            const g = [[], 'B'];
            const parseTable = parseTableBuilder.build(g);
            // debug(parseTable);
            assert.equal(parseTable.firstSymbols.length, 1);
            assert.equal(parseTable.transitions.size, 1);
            assert.equal(parseTable.reductions.size, 2);
        });

        it('Empty sequence Middle', function () {
            const g = ['A', [], 'B'];
            const parseTable = parseTableBuilder.build(g);
            // debug(parseTable);
            assert.equal(parseTable.firstSymbols.length, 1);
            assert.equal(parseTable.transitions.size, 2);
            assert.equal(parseTable.reductions.size, 2);
        });

        it('Empty sequence End', function () {
            const g = ['A', 'B', []];
            const parseTable = parseTableBuilder.build(g);
            // debug(parseTable);
            assert.equal(parseTable.firstSymbols.length, 1);
            assert.equal(parseTable.transitions.size, 2);
            assert.equal(parseTable.reductions.size, 2);
        });

        it('Complex expression', function () {
            const numeric = /^\d+/;
            const expr = {or: [numeric]};
            const addition = [expr, '+', expr];
            const multiplication = [expr, '*', expr];
            expr.or.push(['(', expr, ')'], multiplication, addition);

            const parseTable = parseTableBuilder.build(expr);
            // debug(parseTable);
        });
    });
});
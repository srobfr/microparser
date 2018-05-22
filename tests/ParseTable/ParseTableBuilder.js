const assert = require('assert');
const ParseTableBuilder = require('../../src/ParseTable/ParseTableBuilder');
const ParseTable = require('../../src/ParseTable/ParseTable');
const debug = require('debug')('microparser:test:parseTableBuilder');

describe('ParseTableBuilder', function () {
    const parseTableBuilder = new ParseTableBuilder();

    describe('Scalar', function () {
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

    describe('Infinite recursion', function () {
        const g = ['g'];
        g.push(g);
        const parseTable = parseTableBuilder.build(g);
        // debug(parseTable);
        assert.equal(parseTable.transitions.size, 1);
    });

    describe('Recursion', function () {
        const g = ['g'];
        g.push({or: [g, '']});
        const parseTable = parseTableBuilder.build(g);
        debug(parseTable);
        assert.equal(parseTable.transitions.size, 1);
        const transitionsForG = parseTable.transitions.values().next().value;
        assert.equal(transitionsForG.size, 2);
    });

    // TODO
});
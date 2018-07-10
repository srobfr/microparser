const assert = require('assert');
const ParseTableBuilder = require('../../src/ParseTable/ParseTableBuilder');
const ParseTable = require('../../src/ParseTable/ParseTable');
const debug = require('debug')('microparser:parseTableBuilderTest');
const util = require('util');

/**
 * Tests the ParseTable builder.
 */
describe('ParseTableBuilder', function () {
    const parseTableBuilder = new ParseTableBuilder();

    it('Scalar', function () {
        const parseTable = parseTableBuilder.build('A');
        // debug(parseTable);
        // console.log(util.inspect(parseTable, {hidden: true, depth: 30}));
        assert(parseTable instanceof ParseTable);
        assert.equal(`ParseTable {
  actions: Map { [String: 'A'] => Set { { finish: true } } },
  firstSymbols: [ [String: 'A'] ],
  topSymbol: [String: 'A'] }`, util.inspect(parseTable, {hidden: true, depth: 30}));
    });

    it('Closure', function () {
        const g = (context) => {
        };
        const parseTable = parseTableBuilder.build(g);
        // debug(parseTable);
        // console.log(util.inspect(parseTable, {hidden: true, depth: 30}));
        assert.equal(`ParseTable {
  actions: Map { [Function: g] => Set { { finish: true } } },
  firstSymbols: [ [Function: g] ],
  topSymbol: [Function: g] }`, util.inspect(parseTable, {hidden: true, depth: 30}));
    });

    describe('Sequence', function () {
        it('Start recursion', function () {
            const g = ['A'];
            g.unshift(g); // g = [g, 'A'];
            const parseTable = parseTableBuilder.build(g);
            // debug(parseTable);
            // console.log(util.inspect(parseTable.actions, {hidden: true, depth: 30}));
            assert.equal(`Map {
  [String: 'A'] => Set { { reduce: [ [Circular], [String: 'A'] ] } },
  [ [Circular], [String: 'A'] ] => Set { { shift: [String: 'A'] }, { finish: true } } }`, util.inspect(parseTable.actions, {hidden: true, depth: 30}));
        });

        it('End recursion', function () {
            const g = ['A'];
            g.push(g); // g = ['A', g];
            const parseTable = parseTableBuilder.build(g);
            // debug(parseTable);
            // console.log(util.inspect(parseTable.actions, {hidden: true, depth: 30}));
            assert.equal(`Map {
  [ [String: 'A'], [Circular] ] => Set { { reduce: [ [String: 'A'], [Circular] ] }, { finish: true } },
  [String: 'A'] => Set { { shift: [String: 'A'] } } }`, util.inspect(parseTable.actions, {hidden: true, depth: 30}));
        });

        it('Middle recursion', function () {
            const g = ['A'];
            g.push(g, 'B'); // g = ['A', g, 'B'];
            const parseTable = parseTableBuilder.build(g);
            // debug(parseTable);
            // console.log(util.inspect(parseTable.actions, {hidden: true, depth: 30}));
            assert.equal(`Map {
  [String: 'B'] => Set { { reduce: [ [String: 'A'], [Circular], [String: 'B'] ] } },
  [String: 'A'] => Set { { shift: [String: 'A'] } },
  [ [String: 'A'], [Circular], [String: 'B'] ] => Set { { shift: [String: 'B'] }, { finish: true } } }`, util.inspect(parseTable.actions, {hidden: true, depth: 30}));
        });

        it('Start & End', function () {
            assert.throws(() => {
                const g = ['A'];
                g.unshift(g);
                g.push(g); // g = [g, 'A', g];
                const parseTable = parseTableBuilder.build(g);
                debug(parseTable);
            }, /Wrong grammar/);
        });

        it('Symbol re-usage', function () {
            const w = [','];
            const g = ['a', w, 'b', w, 'c'];
            const parseTable = parseTableBuilder.build(g);
            // debug(parseTable);
            // console.log(util.inspect(parseTable.actions, {hidden: true, depth: 30}));
            assert.equal(`Map {
  [String: 'c'] => Set {
  { reduce:
   [ [String: 'a'],
     [ [String: ','] ],
     [String: 'b'],
     [ [String: ','] ],
     [String: 'c'] ] } },
  [String: ','] => Set { { reduce: [ [String: ','] ] } },
  [String: 'a'] => Set { { shift: [String: ','] } },
  [ [String: ','] ] => Set { { shift: [String: 'b'] } },
  [String: ','] => Set { { reduce: [ [String: ','] ] } },
  [String: 'b'] => Set { { shift: [String: ','] } },
  [ [String: ','] ] => Set { { shift: [String: 'c'] } },
  [ [String: 'a'],
  [ [String: ','] ],
  [String: 'b'],
  [ [String: ','] ],
  [String: 'c'] ] => Set { { finish: true } } }`, util.inspect(parseTable.actions, {hidden: true, depth: 30}));
        });

        it('Symbol re-usage 2', function () {
            const w = {or: [',']};
            w.or.push(w);
            const g = ['a', w, 'b', w, 'c'];
            const parseTable = parseTableBuilder.build(g);
            // debug(parseTable);
            // console.log(util.inspect(parseTable.actions, {hidden: true, depth: 30}));
            assert.equal(`Map {
  [String: 'c'] => Set {
  { reduce:
   [ [String: 'a'],
     { or: [ [String: ','], [Circular] ] },
     [String: 'b'],
     { or: [ [String: ','], [Circular] ] },
     [String: 'c'] ] } },
  [String: ','] => Set { { reduce: { or: [ [String: ','], [Circular] ] } } },
  { or: [ [String: ','], [Circular] ] } => Set {
  { reduce: { or: [ [String: ','], [Circular] ] } },
  { shift: [String: 'b'] } },
  [String: 'a'] => Set { { shift: [String: ','] } },
  [String: ','] => Set { { reduce: { or: [ [String: ','], [Circular] ] } } },
  { or: [ [String: ','], [Circular] ] } => Set {
  { reduce: { or: [ [String: ','], [Circular] ] } },
  { shift: [String: 'c'] } },
  [String: 'b'] => Set { { shift: [String: ','] } },
  [ [String: 'a'],
  { or: [ [String: ','], [Circular] ] },
  [String: 'b'],
  { or: [ [String: ','], [Circular] ] },
  [String: 'c'] ] => Set { { finish: true } } }`, util.inspect(parseTable.actions, {hidden: true, depth: 30}));
        });
    });

    describe('Or', function () {
        it('Simple', function () {
            const g = {or: ['A']};
            const parseTable = parseTableBuilder.build(g);
            // debug(parseTable);
            // console.log(util.inspect(parseTable.actions, {hidden: true, depth: 30}));
            assert.equal(`Map {
  [String: 'A'] => Set { { reduce: { or: [ [String: 'A'] ] } } },
  { or: [ [String: 'A'] ] } => Set { { finish: true } } }`, util.inspect(parseTable.actions, {hidden: true, depth: 30}));
        });

        it('Multiple', function () {
            const g = {or: ['A', 'B', 'C']};
            const parseTable = parseTableBuilder.build(g);
            // debug(parseTable);
            // console.log(util.inspect(parseTable.actions, {hidden: true, depth: 30}));
            assert.equal(`Map {
  [String: 'A'] => Set {
  { reduce: { or: [ [String: 'A'], [String: 'B'], [String: 'C'] ] } } },
  [String: 'B'] => Set {
  { reduce: { or: [ [String: 'A'], [String: 'B'], [String: 'C'] ] } } },
  [String: 'C'] => Set {
  { reduce: { or: [ [String: 'A'], [String: 'B'], [String: 'C'] ] } } },
  { or: [ [String: 'A'], [String: 'B'], [String: 'C'] ] } => Set { { finish: true } } }`, util.inspect(parseTable.actions, {hidden: true, depth: 30}));
        });

        it('Deep', function () {
            const g = {or: ['A', 'B', {or: ['C', 'D']}]};
            const parseTable = parseTableBuilder.build(g);
            // debug(parseTable);
            // console.log(util.inspect(parseTable.actions, {hidden: true, depth: 30}));
            assert.equal(`Map {
  [String: 'A'] => Set {
  { reduce:
   { or:
      [ [String: 'A'],
        [String: 'B'],
        { or: [ [String: 'C'], [String: 'D'] ] } ] } } },
  [String: 'B'] => Set {
  { reduce:
   { or:
      [ [String: 'A'],
        [String: 'B'],
        { or: [ [String: 'C'], [String: 'D'] ] } ] } } },
  [String: 'C'] => Set { { reduce: { or: [ [String: 'C'], [String: 'D'] ] } } },
  [String: 'D'] => Set { { reduce: { or: [ [String: 'C'], [String: 'D'] ] } } },
  { or: [ [String: 'C'], [String: 'D'] ] } => Set {
  { reduce:
   { or:
      [ [String: 'A'],
        [String: 'B'],
        { or: [ [String: 'C'], [String: 'D'] ] } ] } } },
  { or:
   [ [String: 'A'],
     [String: 'B'],
     { or: [ [String: 'C'], [String: 'D'] ] } ] } => Set { { finish: true } } }`, util.inspect(parseTable.actions, {hidden: true, depth: 30}));
        });

        it('No terminal', function () {
            assert.throws(() => {
                const g = [];
                g.push(g);
                parseTableBuilder.build(g);
            }, /no reachable terminal symbol/);
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
            }, /no reachable terminal symbol/);
        });

        it('Recursive start with content', function () {
            const g = {or: ['A']};
            g.or.push(g);
            const parseTable = parseTableBuilder.build(g);
            // debug(parseTable);
            // console.log(util.inspect(parseTable.actions, {hidden: true, depth: 30}));
            assert.equal(`Map {
  [String: 'A'] => Set { { reduce: { or: [ [String: 'A'], [Circular] ] } } },
  { or: [ [String: 'A'], [Circular] ] } => Set {
  { reduce: { or: [ [String: 'A'], [Circular] ] } },
  { finish: true } } }`, util.inspect(parseTable.actions, {hidden: true, depth: 30}));
        });

        it('Recursive end with content', function () {
            const g = {or: ['A']};
            g.or.unshift(g);
            const parseTable = parseTableBuilder.build(g);
            // debug(parseTable);
            // console.log(util.inspect(parseTable.actions, {hidden: true, depth: 30}));
            assert.equal(`Map {
  { or: [ [Circular], [String: 'A'] ] } => Set {
  { reduce: { or: [ [Circular], [String: 'A'] ] } },
  { finish: true } },
  [String: 'A'] => Set { { reduce: { or: [ [Circular], [String: 'A'] ] } } } }`, util.inspect(parseTable.actions, {hidden: true, depth: 30}));
        });

        it('Empty Or', function () {
            const g = {or: []};
            const parseTable = parseTableBuilder.build(g);
            // debug(parseTable);
            // console.log(util.inspect(parseTable.actions, {hidden: true, depth: 30}));
            assert.equal(`Map {
  [String: ''] => Set { { reduce: { or: [ [String: ''] ] } } },
  { or: [ [String: ''] ] } => Set { { finish: true } } }`, util.inspect(parseTable.actions, {hidden: true, depth: 30}));
        });
    });

    describe('Multiple', function () {
        it('Normal', function () {
            const g = {multiple: ['a', 'b']};
            const parseTable = parseTableBuilder.build(g);
            // debug(parseTable);
            // console.log(util.inspect(parseTable, {hidden: true, depth: 30}));
            assert.equal(`ParseTable {
  actions:
   Map {
     [String: 'b'] => Set { { reduce: [ [String: 'a'], [String: 'b'] ] } },
     [String: 'a'] => Set { { shift: [String: 'b'] } },
     [ [String: 'a'], [String: 'b'] ] => Set {
     { shift: [String: 'a'] },
     { reduce: { multiple: [ [String: 'a'], [String: 'b'] ] } } },
     { multiple: [ [String: 'a'], [String: 'b'] ] } => Set { { finish: true } } },
  firstSymbols: [ [String: 'a'] ],
  topSymbol: { multiple: [ [String: 'a'], [String: 'b'] ] } }`, util.inspect(parseTable, {hidden: true, depth: 30}));
        });
    });

    describe('Special cases', function () {
        it('Or+Sequence', function () {
            const parseTable = parseTableBuilder.build(['A', {or: ['B', 'C']}, 'D']);
            // debug(parseTable);
            // console.log(util.inspect(parseTable.actions, {hidden: true, depth: 30}));
            assert.equal(`Map {
  [String: 'D'] => Set {
  { reduce:
   [ [String: 'A'],
     { or: [ [String: 'B'], [String: 'C'] ] },
     [String: 'D'] ] } },
  [String: 'B'] => Set { { reduce: { or: [ [String: 'B'], [String: 'C'] ] } } },
  [String: 'C'] => Set { { reduce: { or: [ [String: 'B'], [String: 'C'] ] } } },
  [String: 'A'] => Set { { shift: [String: 'B'] }, { shift: [String: 'C'] } },
  { or: [ [String: 'B'], [String: 'C'] ] } => Set { { shift: [String: 'D'] } },
  [ [String: 'A'],
  { or: [ [String: 'B'], [String: 'C'] ] },
  [String: 'D'] ] => Set { { finish: true } } }`, util.inspect(parseTable.actions, {hidden: true, depth: 30}));
        });

        it('Recursion with exit', function () {
            const g = ['A'];
            const o = {or: [g, 'End']};
            g.push(o); // g = ['A', {or: [g, 'End']}]

            const parseTable = parseTableBuilder.build(g);
            // debug(parseTable);
            // console.log(util.inspect(parseTable.actions, {hidden: true, depth: 30}));
            assert.equal(`Map {
  { or: [ [ [String: 'A'], [Circular] ], [String: 'End'] ] } => Set {
  { reduce: [ [String: 'A'], { or: [ [Circular], [String: 'End'] ] } ] } },
  [ [String: 'A'], { or: [ [Circular], [String: 'End'] ] } ] => Set {
  { reduce: { or: [ [ [String: 'A'], [Circular] ], [String: 'End'] ] } },
  { finish: true } },
  [String: 'End'] => Set {
  { reduce: { or: [ [ [String: 'A'], [Circular] ], [String: 'End'] ] } } },
  [String: 'A'] => Set { { shift: [String: 'A'] }, { shift: [String: 'End'] } } }`, util.inspect(parseTable.actions, {hidden: true, depth: 30}));
        });

        it('Empty sequence Start', function () {
            const g = [[], 'B'];
            const parseTable = parseTableBuilder.build(g);
            // debug(parseTable);
            // console.log(util.inspect(parseTable.actions, {hidden: true, depth: 30}));
            assert.equal(`Map {
  [String: 'B'] => Set { { reduce: [ [ [String: ''] ], [String: 'B'] ] } },
  [String: ''] => Set { { reduce: [ [String: ''] ] } },
  [ [String: ''] ] => Set { { shift: [String: 'B'] } },
  [ [ [String: ''] ], [String: 'B'] ] => Set { { finish: true } } }`, util.inspect(parseTable.actions, {hidden: true, depth: 30}));
        });

        it('Empty sequence Middle', function () {
            const g = ['A', [], 'B'];
            const parseTable = parseTableBuilder.build(g);
            // debug(parseTable);
            // console.log(util.inspect(parseTable.actions, {hidden: true, depth: 30}));
            assert.equal(`Map {
  [String: 'B'] => Set {
  { reduce: [ [String: 'A'], [ [String: ''] ], [String: 'B'] ] } },
  [String: ''] => Set { { reduce: [ [String: ''] ] } },
  [String: 'A'] => Set { { shift: [String: ''] } },
  [ [String: ''] ] => Set { { shift: [String: 'B'] } },
  [ [String: 'A'], [ [String: ''] ], [String: 'B'] ] => Set { { finish: true } } }`, util.inspect(parseTable.actions, {hidden: true, depth: 30}));
        });

        it('Empty sequence End', function () {
            const g = ['A', 'B', []];
            const parseTable = parseTableBuilder.build(g);
            // debug(parseTable);
            // console.log(util.inspect(parseTable.actions, {hidden: true, depth: 30}));
            assert.equal(`Map {
  [ [String: ''] ] => Set {
  { reduce: [ [String: 'A'], [String: 'B'], [ [String: ''] ] ] } },
  [String: 'A'] => Set { { shift: [String: 'B'] } },
  [String: ''] => Set { { reduce: [ [String: ''] ] } },
  [String: 'B'] => Set { { shift: [String: ''] } },
  [ [String: 'A'], [String: 'B'], [ [String: ''] ] ] => Set { { finish: true } } }`, util.inspect(parseTable.actions, {hidden: true, depth: 30}));
        });

        it('Complex expression', function () {
            const numeric = /^\d+/;
            const expr = {or: [numeric]};
            const addition = [expr, '+', expr];
            const multiplication = [expr, '*', expr];
            expr.or.push(['(', expr, ')'], multiplication, addition);

            const parseTable = parseTableBuilder.build(expr);
            // debug(parseTable);
            // console.log(util.inspect(parseTable.actions, {hidden: true, depth: 30}));
            assert.equal(`Map {
  /^\\d+/ => Set {
  { reduce:
   { or:
      [ /^\\d+/,
        [ [String: '('], [Circular], [String: ')'] ],
        [ [Circular], [String: '*'], [Circular] ],
        [ [Circular], [String: '+'], [Circular] ] ] } } },
  [String: ')'] => Set {
  { reduce:
   [ [String: '('],
     { or:
        [ /^\\d+/,
          [Circular],
          [ [Circular], [String: '*'], [Circular] ],
          [ [Circular], [String: '+'], [Circular] ] ] },
     [String: ')'] ] } },
  [String: '('] => Set { { shift: /^\\d+/ }, { shift: [String: '('] } },
  { or:
   [ /^\\d+/,
     [ [String: '('], [Circular], [String: ')'] ],
     [ [Circular], [String: '*'], [Circular] ],
     [ [Circular], [String: '+'], [Circular] ] ] } => Set {
  { shift: [String: ')'] },
  { reduce:
   [ { or:
        [ /^\\d+/,
          [ [String: '('], [Circular], [String: ')'] ],
          [Circular],
          [ [Circular], [String: '+'], [Circular] ] ] },
     [String: '*'],
     { or:
        [ /^\\d+/,
          [ [String: '('], [Circular], [String: ')'] ],
          [Circular],
          [ [Circular], [String: '+'], [Circular] ] ] } ] },
  { shift: [String: '*'] },
  { reduce:
   [ { or:
        [ /^\\d+/,
          [ [String: '('], [Circular], [String: ')'] ],
          [ [Circular], [String: '*'], [Circular] ],
          [Circular] ] },
     [String: '+'],
     { or:
        [ /^\\d+/,
          [ [String: '('], [Circular], [String: ')'] ],
          [ [Circular], [String: '*'], [Circular] ],
          [Circular] ] } ] },
  { shift: [String: '+'] },
  { finish: true } },
  [ [String: '('],
  { or:
     [ /^\\d+/,
       [Circular],
       [ [Circular], [String: '*'], [Circular] ],
       [ [Circular], [String: '+'], [Circular] ] ] },
  [String: ')'] ] => Set {
  { reduce:
   { or:
      [ /^\\d+/,
        [ [String: '('], [Circular], [String: ')'] ],
        [ [Circular], [String: '*'], [Circular] ],
        [ [Circular], [String: '+'], [Circular] ] ] } } },
  [String: '*'] => Set { { shift: /^\\d+/ }, { shift: [String: '('] } },
  [ { or:
     [ /^\\d+/,
       [ [String: '('], [Circular], [String: ')'] ],
       [Circular],
       [ [Circular], [String: '+'], [Circular] ] ] },
  [String: '*'],
  { or:
     [ /^\\d+/,
       [ [String: '('], [Circular], [String: ')'] ],
       [Circular],
       [ [Circular], [String: '+'], [Circular] ] ] } ] => Set {
  { reduce:
   { or:
      [ /^\\d+/,
        [ [String: '('], [Circular], [String: ')'] ],
        [ [Circular], [String: '*'], [Circular] ],
        [ [Circular], [String: '+'], [Circular] ] ] } } },
  [String: '+'] => Set { { shift: /^\\d+/ }, { shift: [String: '('] } },
  [ { or:
     [ /^\\d+/,
       [ [String: '('], [Circular], [String: ')'] ],
       [ [Circular], [String: '*'], [Circular] ],
       [Circular] ] },
  [String: '+'],
  { or:
     [ /^\\d+/,
       [ [String: '('], [Circular], [String: ')'] ],
       [ [Circular], [String: '*'], [Circular] ],
       [Circular] ] } ] => Set {
  { reduce:
   { or:
      [ /^\\d+/,
        [ [String: '('], [Circular], [String: ')'] ],
        [ [Circular], [String: '*'], [Circular] ],
        [ [Circular], [String: '+'], [Circular] ] ] } } } }`, util.inspect(parseTable.actions, {hidden: true, depth: 30}));
        });
    });
});
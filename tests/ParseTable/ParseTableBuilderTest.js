const assert = require('assert');
const ParseTableBuilder = require('../../src/ParseTable/ParseTableBuilder');
const ParseTable = require('../../src/ParseTable/ParseTable');
const debug = require('debug')('microparser:parseTableBuilderTest');
const testUtils = require('../testUtils');

/**
 * Tests the ParseTable builder.
 */
describe('ParseTableBuilder', function () {
    const parseTableBuilder = new ParseTableBuilder();

    it('Scalar', function () {
        const parseTable = parseTableBuilder.build('A');
        debug('parseTable', testUtils.inspect(parseTable));
        assert(parseTable instanceof ParseTable);
        testUtils.inspectEqual(`ParseTable {
  actions: Map { [String: 'A'] => Set { { finish: true } } },
  firstSymbols: [ [String: 'A'] ],
  topSymbol: [String: 'A'],
  originalGrammarsMap: Map { [String: 'A'] => 'A' },
  firstsLastsBySymbol:
   Map {
     [String: 'A'] => { firsts: Set { [String: 'A'] }, lasts: Set { [String: 'A'] } } } }`, parseTable);
    });

    it('Closure', function () {
        const g = (context) => {
        };
        const parseTable = parseTableBuilder.build(g);
        debug('parseTable', testUtils.inspect(parseTable));
        testUtils.inspectEqual(`ParseTable {
  actions: Map { [Function: g] => Set { { finish: true } } },
  firstSymbols: [ [Function: g] ],
  topSymbol: [Function: g],
  originalGrammarsMap: Map { [Function: g] => [Function: g] },
  firstsLastsBySymbol:
   Map {
     [Function: g] => { firsts: Set { [Function: g] }, lasts: Set { [Function: g] } } } }`, parseTable);
    });

    describe('Sequence', function () {
        it('Start recursion', function () {
            assert.throws(() => {
                const g = ['A'];
                g.unshift(g); // g = [g, 'A'];
                parseTableBuilder.build(g);
            }, /Wrong grammar \(no first symbol\)/);
        });

        it('End recursion', function () {
            assert.throws(() => {
                const g = ['A'];
                g.push(g); // g = ['A', g];
                parseTableBuilder.build(g);
            }, /Wrong grammar \(no terminal symbol\)/);
        });

        it('Middle recursion', function () {
            const g = ['A'];
            g.push(g, 'B'); // g = ['A', g, 'B'];
            const parseTable = parseTableBuilder.build(g);
            // debug(parseTable);
            // console.log(util.inspect(parseTable.actions, {hidden: true, depth: 30}));
            testUtils.inspectEqual(`Map {
  [String: 'B'] => Set { { reduce: [ [String: 'A'], [Circular], [String: 'B'] ] } },
  [String: 'A'] => Set { { shift: [String: 'A'] } },
  [ [String: 'A'], [Circular], [String: 'B'] ] => Set { { shift: [String: 'B'] }, { finish: true } } }`, parseTable.actions);
        });

        it('Start & End', function () {
            assert.throws(() => {
                const g = ['A'];
                g.unshift(g);
                g.push(g); // g = [g, 'A', g];
                const parseTable = parseTableBuilder.build(g);
                // debug('parseTable', testUtils.inspect(parseTable));
            }, /Wrong grammar/);
        });

        it('Symbol re-usage', function () {
            const w = [','];
            const g = ['a', w, 'b', w, 'c'];
            const parseTable = parseTableBuilder.build(g);
            // debug(parseTable);
            // console.log(util.inspect(parseTable.actions, {hidden: true, depth: 30}));
            testUtils.inspectEqual(`Map {
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
  [String: 'c'] ] => Set { { finish: true } } }`, parseTable.actions);
        });

        it('Symbol re-usage 2', function () {
            const w = {or: [',']};
            w.or.push(w);
            const g = ['a', w, 'b', w, 'c'];
            const parseTable = parseTableBuilder.build(g);
            // debug(parseTable);
            // console.log(util.inspect(parseTable.actions, {hidden: true, depth: 30}));
            testUtils.inspectEqual(`Map {
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
  [String: 'c'] ] => Set { { finish: true } } }`, parseTable.actions);
        });
    });

    describe('Or', function () {
        it('Simple', function () {
            const g = {or: ['A']};
            const parseTable = parseTableBuilder.build(g);
            // debug(parseTable);
            // console.log(util.inspect(parseTable.actions, {hidden: true, depth: 30}));
            testUtils.inspectEqual(`Map {
  [String: 'A'] => Set { { reduce: { or: [ [String: 'A'] ] } } },
  { or: [ [String: 'A'] ] } => Set { { finish: true } } }`, parseTable.actions);
        });

        it('Multiple', function () {
            const g = {or: ['A', 'B', 'C']};
            const parseTable = parseTableBuilder.build(g);
            // debug(parseTable);
            // console.log(util.inspect(parseTable.actions, {hidden: true, depth: 30}));
            testUtils.inspectEqual(`Map {
  [String: 'A'] => Set {
  { reduce: { or: [ [String: 'A'], [String: 'B'], [String: 'C'] ] } } },
  [String: 'B'] => Set {
  { reduce: { or: [ [String: 'A'], [String: 'B'], [String: 'C'] ] } } },
  [String: 'C'] => Set {
  { reduce: { or: [ [String: 'A'], [String: 'B'], [String: 'C'] ] } } },
  { or: [ [String: 'A'], [String: 'B'], [String: 'C'] ] } => Set { { finish: true } } }`, parseTable.actions);
        });

        it('Deep', function () {
            const g = {or: ['A', 'B', {or: ['C', 'D']}]};
            const parseTable = parseTableBuilder.build(g);
            // debug(parseTable);
            // console.log(util.inspect(parseTable.actions, {hidden: true, depth: 30}));
            testUtils.inspectEqual(`Map {
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
     { or: [ [String: 'C'], [String: 'D'] ] } ] } => Set { { finish: true } } }`, parseTable.actions);
        });

        it('Empty', function () {
            assert.throws(() => {
                const g = [];
                g.push(g);
                parseTableBuilder.build(g);
            }, /Wrong grammar \(no first symbol\)/);
        });

        it('Recursive', function () {
            assert.throws(() => {
                const g = {or: []};
                g.or.push(g);
                parseTableBuilder.build(g);
            }, /Wrong grammar \(no first symbol\)/);
        });

        it('Recursive start with content', function () {
            const g = {or: ['A']};
            g.or.push(g);
            const parseTable = parseTableBuilder.build(g);
            // debug(parseTable);
            // console.log(util.inspect(parseTable.actions, {hidden: true, depth: 30}));
            testUtils.inspectEqual(`Map {
  [String: 'A'] => Set { { reduce: { or: [ [String: 'A'], [Circular] ] } } },
  { or: [ [String: 'A'], [Circular] ] } => Set {
  { reduce: { or: [ [String: 'A'], [Circular] ] } },
  { finish: true } } }`, parseTable.actions);
        });

        it('Recursive end with content', function () {
            const g = {or: ['A']};
            g.or.unshift(g);
            const parseTable = parseTableBuilder.build(g);
            // debug('parseTable', testUtils.inspect(parseTable));
            testUtils.inspectEqual(`Map {
  { or: [ [Circular], [String: 'A'] ] } => Set {
  { reduce: { or: [ [Circular], [String: 'A'] ] } },
  { finish: true } },
  [String: 'A'] => Set { { reduce: { or: [ [Circular], [String: 'A'] ] } } } }`, parseTable.actions);
        });

        it('Empty Or', function () {
            const g = {or: []};
            const parseTable = parseTableBuilder.build(g);
            // debug(parseTable);
            // console.log(util.inspect(parseTable.actions, {hidden: true, depth: 30}));
            testUtils.inspectEqual(`Map {
  [String: ''] => Set { { reduce: { or: [ [String: ''] ] } } },
  { or: [ [String: ''] ] } => Set { { finish: true } } }`, parseTable.actions);
        });
    });

    describe('Multiple', function () {
        it('Normal', function () {
            const g = {multiple: ['a', 'b']};
            const parseTable = parseTableBuilder.build(g);
            debug('parseTable', testUtils.inspect(parseTable));
            // console.log(util.inspect(parseTable, {hidden: true, depth: 30}));
            testUtils.inspectEqual(`ParseTable {
  actions:
   Map {
     [String: 'b'] => Set { { reduce: [ [String: 'a'], [String: 'b'] ] } },
     [String: 'a'] => Set { { shift: [String: 'b'] } },
     [ [String: 'a'], [String: 'b'] ] => Set {
       { shift: [String: 'a'] },
       { reduce: { multiple: [ [String: 'a'], [String: 'b'] ] } } },
     { multiple: [ [String: 'a'], [String: 'b'] ] } => Set { { finish: true } } },
  firstSymbols: [ [String: 'a'] ],
  topSymbol: { multiple: [ [String: 'a'], [String: 'b'] ] },
  originalGrammarsMap:
   Map {
     [String: 'a'] => 'a',
     [String: 'b'] => 'b',
     [ [String: 'a'], [String: 'b'] ] => [ 'a', 'b' ],
     { multiple: [ [String: 'a'], [String: 'b'] ] } => { multiple: [ 'a', 'b' ] } },
  firstsLastsBySymbol:
   Map {
     { multiple: [ [String: 'a'], [String: 'b'] ] } => { firsts: Set { [String: 'a'] }, lasts: Set { [String: 'b'] } },
     [ [String: 'a'], [String: 'b'] ] => { firsts: Set { [String: 'a'] }, lasts: Set { [String: 'b'] } },
     [String: 'a'] => { firsts: Set { [String: 'a'] }, lasts: Set { [String: 'a'] } },
     [String: 'b'] => { firsts: Set { [String: 'b'] }, lasts: Set { [String: 'b'] } } } }`, parseTable);
        });
    });

    describe('Special cases', function () {
        it('Or+Sequence', function () {
            const parseTable = parseTableBuilder.build(['A', {or: ['B', 'C']}, 'D']);
            // debug(parseTable);
            // console.log(util.inspect(parseTable.actions, {hidden: true, depth: 30}));
            testUtils.inspectEqual(`Map {
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
  [String: 'D'] ] => Set { { finish: true } } }`, parseTable.actions);
        });

        it('Recursion with exit', function () {
            const g = ['A'];
            const o = {or: [g, 'End']};
            g.push(o); // g = ['A', {or: [g, 'End']}]

            const parseTable = parseTableBuilder.build(g);
            // debug(parseTable);
            // console.log(util.inspect(parseTable.actions, {hidden: true, depth: 30}));
            testUtils.inspectEqual(`Map {
  { or: [ [ [String: 'A'], [Circular] ], [String: 'End'] ] } => Set {
  { reduce: [ [String: 'A'], { or: [ [Circular], [String: 'End'] ] } ] } },
  [ [String: 'A'], { or: [ [Circular], [String: 'End'] ] } ] => Set {
  { reduce: { or: [ [ [String: 'A'], [Circular] ], [String: 'End'] ] } },
  { finish: true } },
  [String: 'End'] => Set {
  { reduce: { or: [ [ [String: 'A'], [Circular] ], [String: 'End'] ] } } },
  [String: 'A'] => Set { { shift: [String: 'A'] }, { shift: [String: 'End'] } } }`, parseTable.actions);
        });

        it('Empty sequence Start', function () {
            const g = [[], 'B'];
            const parseTable = parseTableBuilder.build(g);
            // debug(parseTable);
            // console.log(util.inspect(parseTable.actions, {hidden: true, depth: 30}));
            testUtils.inspectEqual(`Map {
  [String: 'B'] => Set { { reduce: [ [ [String: ''] ], [String: 'B'] ] } },
  [String: ''] => Set { { reduce: [ [String: ''] ] } },
  [ [String: ''] ] => Set { { shift: [String: 'B'] } },
  [ [ [String: ''] ], [String: 'B'] ] => Set { { finish: true } } }`, parseTable.actions);
        });

        it('Empty sequence Middle', function () {
            const g = ['A', [], 'B'];
            const parseTable = parseTableBuilder.build(g);
            // debug(parseTable);
            // console.log(util.inspect(parseTable.actions, {hidden: true, depth: 30}));
            testUtils.inspectEqual(`Map {
  [String: 'B'] => Set {
  { reduce: [ [String: 'A'], [ [String: ''] ], [String: 'B'] ] } },
  [String: ''] => Set { { reduce: [ [String: ''] ] } },
  [String: 'A'] => Set { { shift: [String: ''] } },
  [ [String: ''] ] => Set { { shift: [String: 'B'] } },
  [ [String: 'A'], [ [String: ''] ], [String: 'B'] ] => Set { { finish: true } } }`, parseTable.actions);
        });

        it('Empty sequence End', function () {
            const g = ['A', 'B', []];
            const parseTable = parseTableBuilder.build(g);
            // debug(parseTable);
            // console.log(util.inspect(parseTable.actions, {hidden: true, depth: 30}));
            testUtils.inspectEqual(`Map {
  [ [String: ''] ] => Set {
  { reduce: [ [String: 'A'], [String: 'B'], [ [String: ''] ] ] } },
  [String: 'A'] => Set { { shift: [String: 'B'] } },
  [String: ''] => Set { { reduce: [ [String: ''] ] } },
  [String: 'B'] => Set { { shift: [String: ''] } },
  [ [String: 'A'], [String: 'B'], [ [String: ''] ] ] => Set { { finish: true } } }`, parseTable.actions);
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
            testUtils.inspectEqual(`Map {
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
        [ [Circular], [String: '+'], [Circular] ] ] } } } }`, parseTable.actions);
        });
    });

    it('firstsLastsBySymbol', function () {
        const parseTable = parseTableBuilder.build({
            multiple: [{or: ['a', 'b']}]
        });
        // debug(parseTable);
        // debug('parseTable', testUtils.inspect(parseTable));
        testUtils.inspectEqual(`ParseTable {
  actions:
   Map {
     { or: [ [String: 'a'], [String: 'b'] ] } => Set { { reduce: [ { or: [ [String: 'a'], [String: 'b'] ] } ] } },
     [String: 'a'] => Set { { reduce: { or: [ [String: 'a'], [String: 'b'] ] } } },
     [String: 'b'] => Set { { reduce: { or: [ [String: 'a'], [String: 'b'] ] } } },
     [ { or: [ [String: 'a'], [String: 'b'] ] } ] => Set {
       { shift: [String: 'a'] },
       { shift: [String: 'b'] },
       { reduce: { multiple: [ { or: [ [String: 'a'], [String: 'b'] ] } ] } } },
     { multiple: [ { or: [ [String: 'a'], [String: 'b'] ] } ] } => Set { { finish: true } } },
  firstSymbols: [ [String: 'a'], [String: 'b'] ],
  topSymbol: { multiple: [ { or: [ [String: 'a'], [String: 'b'] ] } ] },
  originalGrammarsMap:
   Map {
     [String: 'a'] => 'a',
     [String: 'b'] => 'b',
     { or: [ [String: 'a'], [String: 'b'] ] } => { or: [ 'a', 'b' ] },
     [ { or: [ [String: 'a'], [String: 'b'] ] } ] => [ { or: [ 'a', 'b' ] } ],
     { multiple: [ { or: [ [String: 'a'], [String: 'b'] ] } ] } => { multiple: [ { or: [ 'a', 'b' ] } ] } },
  firstsLastsBySymbol:
   Map {
     { multiple: [ { or: [ [String: 'a'], [String: 'b'] ] } ] } => { firsts: Set { [String: 'a'], [String: 'b'] },
       lasts: Set { [String: 'a'], [String: 'b'] } },
     [ { or: [ [String: 'a'], [String: 'b'] ] } ] => { firsts: Set { [String: 'a'], [String: 'b'] },
       lasts: Set { [String: 'a'], [String: 'b'] } },
     { or: [ [String: 'a'], [String: 'b'] ] } => { firsts: Set { [String: 'a'], [String: 'b'] },
       lasts: Set { [String: 'a'], [String: 'b'] } },
     [String: 'a'] => { firsts: Set { [String: 'a'] }, lasts: Set { [String: 'a'] } },
     [String: 'b'] => { firsts: Set { [String: 'b'] }, lasts: Set { [String: 'b'] } } } }`, parseTable);
    });

});

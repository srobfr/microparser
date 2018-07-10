const assert = require('assert');
const Parser = require('../../src/Parser/Parser');
const debug = require('debug')('microparser:parserTest');
const util = require('util');

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

    it('Multiple', function () {
        const result = parser.parse({multiple: 'Foo'}, 'Foo'.repeat(5));
        debug(result);
        assert.equal(`[ [ 'Foo' ], [ 'Foo' ], [ 'Foo' ], [ 'Foo' ], [ 'Foo' ] ]`, util.inspect(result, {hidden: true, depth: 30}));
    });

    it('Ambiguous', function () {
        // In this case, we should keep the 'B' case (the first).
        const result = parser.parse(['A', {or: ['B', /^B/, /^[B]/]}, 'C'], 'ABC');
        debug(result);
    });

    it('Symbol re-usage', function () {
        const w = {or: [',', '']};
        const g = ['a', w, 'b', w, 'c'];
        assert.throws(() => {
            const result = parser.parse(g, 'abbc');
            debug(result);
        }, /\n  \^ expected ',' or 'c'/);
    });

    describe('Simple Expression', function () {
        const v = /^\d+/;
        const expr = {or: [v]};
        expr.tag = 'expr';
        const sum = [expr, '+', expr];
        sum.tag = 'sum';
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
            assert.equal(`[ [ [ [ '1' ] ], [ '+' ], [ [ '2' ] ] ] ]`, util.inspect(result, {hidden: true, depth: 30}));
        });
    });

    describe('Closures', function () {
        it('Noop', function () {
            assert.throws(() => {
                const g = context => {/* Returns a non-string : never matches anything */
                };
                const result = parser.parse(g, 'ABC');
                debug(result);
            }, /\n\^ expected \[Function: g\]/);
        });

        it('Match', function () {
            const g = context => 'Foo'; // Artificially matches the code. Don't do this...
            const result = parser.parse(g, 'Foo');
            assert.equal('Foo', result);
        });

        // Heredoc-like syntax
        // This is a tricky case, because the closing mark must match the opening one to be valid.
        const hereDocStart = /^[A-Z]+/;
        const hereDocContent = context => {
            // Any text but the previously matched heredoc start id
            const startId = context.previousContext.matchedCode;
            const m = context.code.substring(context.offset).match(new RegExp('^(.+?)' + startId));
            return m ? m[1] : null;
        };
        const hereDocEnd = context => {
            const startId = context.previousContext.previousContext.matchedCode;
            return context.code.substring(context.offset).startsWith(startId) ? startId : null;
        };

        const heredoc = [hereDocStart, hereDocContent, hereDocEnd];

        it('Heredoc Match', function () {
            const result = parser.parse(heredoc, 'FOO plop FOO');
            assert.equal(`[ [ 'FOO' ], [ ' plop ' ], [ 'FOO' ] ]`, util.inspect(result));
        });

        it('Unclosed heredoc', function () {
            assert.throws(() => {
                const result = parser.parse(heredoc, 'TEST qdsfsde');
                debug(result)
            }, /\n    \^ expected \[Function: hereDocContent\]/);
        });
    });

    describe('Ambiguous grammar', function () {
        const numeric = /^\d+/;
        const expr = {or: [numeric]};
        const mult = [expr, '*', expr];
        mult.tag = 'mult';
        const sum = [expr, '+', expr];
        sum.tag = 'sum';
        expr.or.push(mult, sum);

        it('Right to left', function () {
            const result = parser.parse(expr, '1+2*3');
            // debug(result);
            // console.log(util.inspect(result, {hidden: true, depth: 30}));
            assert.equal(`[ [ [ [ '1' ] ],
    [ '+' ],
    [ [ [ [ '2' ] ], [ '*' ], [ [ '3' ] ] ] ] ] ]`, util.inspect(result, {hidden: true, depth: 30}));
        });
        it('Left to right', function () {
            const result = parser.parse(expr, '1*2+3');
            // debug(result);
            // console.log(util.inspect(result, {hidden: true, depth: 30}));
            assert.equal(`[ [ [ [ [ [ '1' ] ], [ '*' ], [ [ '2' ] ] ] ],
    [ '+' ],
    [ [ '3' ] ] ] ]`, util.inspect(result, {hidden: true, depth: 30}));
        });
    });

    describe('Multiple', function () {
        it('End infinite recursion', function () {
            // In this case, the parser expects an infinite sequence of 'Foo's.
            // This is useless as the parsing will eventually fail at some point, but technically the parser can handle it.
            assert.throws(() => {
                const g = ['Foo'];
                g.push(g);
                parser.parse(g, 'FooFooFooFoo');
            }, /\n            \^ expected 'Foo'/);
        });

        it('Start infinite recursion', function () {
            // In this case, the parser (which parses from left to right) cannot cross the infinite recursion needed to go further.
            // This is a bad grammar design AND useless anyway.
            assert.throws(() => {
                const g = ['Foo'];
                g.unshift(g);
                parser.parse(g, 'FooFooFooFoo');
            }, /\n\^ Grammar error./);
        });

        it('End Recursion', function () {
            const g = ['Foo'];
            g.tag = 'foo';
            g.push({or: [g, '']});
            const result = parser.parse(g, 'FooFooFooFoo');
            // console.log(util.inspect(result, {hidden: true, depth: 30}));
            assert.equal(`[ [ 'Foo' ],
  [ [ [ 'Foo' ], [ [ [ 'Foo' ], [ [ [ 'Foo' ], [ [ '' ] ] ] ] ] ] ] ] ]`, util.inspect(result, {hidden: true, depth: 30}));
        });

        it('Start Recursion', function () {
            const g = ['Foo'];
            g.tag = 'foo';
            g.unshift({or: [g, '']});
            const result = parser.parse(g, 'FooFooFooFoo');
            // console.log(util.inspect(result, {hidden: true, depth: 30}));
            assert.equal(`[ [ [ [ [ [ [ [ [ '' ] ], [ 'Foo' ] ] ], [ 'Foo' ] ] ], [ 'Foo' ] ] ],
  [ 'Foo' ] ]`, util.inspect(result, {hidden: true, depth: 30}));
        });
    });

    describe('Evaluate', function () {
        it('XML-ish', function () {
            const parser = new Parser({
                evaluate: function (context, children) {
                    return context.symbol.tag
                        ? `<${context.symbol.tag}>${children.join('')}</${context.symbol.tag}>`
                        : context.matchedCode;
                }
            });

            const a = Object.assign(['a'], {tag: 'a'});
            const b = Object.assign(['b'], {tag: 'b'});
            const c = Object.assign([a, b], {tag: 'c'});
            debug({c});
            const result = parser.parse(c, 'ab');
            assert.equal(`<c><a>a</a><b>b</b></c>`, result);
        });
    });
});

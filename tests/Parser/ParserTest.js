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

    it('Ambiguous', function () {
        // In this case, we should keep the 'B' case (the first).
        const result = parser.parse(['A', {or: ['B', /^B/, /^[B]/]}, 'C'], 'ABC');
        debug(result);
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
            assert.equal(`<expr><sum><expr>1</expr>+<expr>2</expr></sum></expr>`, result);
        });
    });

    describe.only('Closures', function () {
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
            const m = context.code.substr(context.offset).match(new RegExp('^(.+?)' + startId));
            return m ? m[1] : null;
        };
        const hereDocEnd = context => {
            const startId = context.previousContext.previousContext.matchedCode;
            return context.code.substr(context.offset).startsWith(startId) ? startId : null;
        };

        const heredoc = [hereDocStart, hereDocContent, hereDocEnd];

        it('Heredoc Match', function () {
            const result = parser.parse(heredoc, 'FOO plop FOO');
            assert.equal(`[ 'FOO', ' plop ', 'FOO' ]`, util.inspect(result));
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
            debug(result);
            assert.equal(`<sum>1+<mult>2*3</mult></sum>`, result);
        });
        it('Left to right', function () {
            const result = parser.parse(expr, '1*2+3');
            debug(result);
            assert.equal(`<sum><mult>1*2</mult>+3</sum>`, result);
        });
    });

    describe('Multiple', function () {
        it('End infinite recursion', function () {
            assert.throws(() => {
                const g = ['Foo'];
                g.push(g);
                parser.parse(g, 'FooFooFooFoo');
            }, /FooFooFooFoo\n            \^ expected 'Foo'/);
        });

        it('Start infinite recursion', function () {
            assert.throws(() => {
                const g = ['Foo'];
                g.unshift(g);
                parser.parse(g, 'FooFooFooFoo');
            }, /FooFooFooFoo\n            \^ expected 'Foo'/);
        });

        it('End Recursion', function () {
            const g = ['Foo'];
            g.tag = 'foo';
            g.push({or: [g, '']});
            const result = parser.parse(g, 'FooFooFooFoo');
            assert.equal(`<foo>Foo<foo>Foo<foo>Foo<foo>Foo</foo></foo></foo></foo>`, result);
        });

        it('Start Recursion', function () {
            const g = ['Foo'];
            g.tag = 'foo';
            g.unshift({or: [g, '']});
            const result = parser.parse(g, 'FooFooFooFoo');
            assert.equal(`<foo><foo><foo><foo>Foo</foo>Foo</foo>Foo</foo>Foo</foo>`, result);
        });
    });
});

const _ = require("lodash");
const CompiledGrammar = require(__dirname + "/../CompiledGrammar.js");
const Context = require(__dirname + "/Context.js");

/**
 * Generates a syntax error message.
 * @param code
 * @param bestOffset
 * @param expected
 */
function reportSyntaxError(code, bestOffset, expected) {
    expected = _.uniq(expected);
    let lines = code.split("\n");
    let o = 0;
    _.each(lines, function (line, i) {
        let l = line.length;
        if (o + i <= bestOffset && bestOffset <= o + i + l) {
            let lineOffset = bestOffset - (o + i) + 1;
            let spaces = new Array(lineOffset).join(" ");

            let expectedStr = (
                expected.length
                    ? "expected " + _.map(expected, function (expected) {
                        if (expected === null) return "nothing";
                        return require("util").inspect(expected, {colors: false});
                    }).join(" or ")
                    : "Grammar error : no escape case found."
            );

            let message = `Syntax error on line ${i + 1}, column ${lineOffset}:\n${line}\n${spaces}^ ${expectedStr}`;
            throw new Error(message);
        }
        o += l;
    });
}

/**
 * Handles the expected list, useful for the syntax error message generation.
 * @param {Context} context
 * @param {int} bestOffset
 * @param {Array} expected
 * @return {[int,Array.<*>]}
 */
function handleExpected(context, bestOffset, expected) {
    if (context.offset >= bestOffset) {
        if (context.offset > bestOffset) {
            bestOffset = context.offset;
            expected = [];
        }

        if (context.cg.type === CompiledGrammar.START && (_.isString(context.cg.grammar) || _.isRegExp(context.cg.grammar))) {
            expected.push(context.cg.grammar);
        }
    }

    return [bestOffset, expected];
}

/**
 *
 * @param cg
 * @param code
 * @return {*}
 */
function lex(cg, code) {
    let bestOffset = 0;
    let expected = [];
    const toVisit = [new Context(cg, 0, code, null, null)];
    while (toVisit.length > 0) {
        let context = toVisit.pop();

        if (!context.match()) {
            [bestOffset, expected] = handleExpected(context, bestOffset, expected);
            continue; // Go to next context.
        }

        const nextContexts = context.getNextContexts();

        // Condition de sortie
        if (nextContexts.length === 0) {
            if (context.endOffset < code.length) {
                // Too much code.
                reportSyntaxError(code, context.endOffset, (bestOffset < context.endOffset ? [null] : expected.concat([null])));
            }

            return context.getChain();
        }

        // Contextes suivants.
        _.eachRight(nextContexts, function (nextContext) {
            toVisit.push(nextContext);
        });
    }

    // Syntax error.
    reportSyntaxError(code, bestOffset, expected);
}

module.exports = {
    lex: lex
};
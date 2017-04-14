const _ = require("lodash");
const CompiledGrammar = require(__dirname + "/../CompiledGrammar.js");
const Context = require(__dirname + "/Context.js");

/**
 * Generates a syntax error message.
 * @param code
 * @param bestOffset
 * @param expected
 * @param isTimeout
 */
function throwSyntaxError(code, bestOffset, expected, isTimeout) {
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
                        if (expected.type === "not") return "not(" + require("util").inspect(expected.value, {colors: false}) + ")";
                        return require("util").inspect(expected, {colors: false});
                    }).join(" or ")
                    : "Grammar error : no escape case found."
            );

            const errorType = (isTimeout ? "Timeout" : "Syntax error");
            let message = `${errorType} on line ${i + 1}, column ${lineOffset}:\n${line}\n${spaces}^ ${expectedStr}`;
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
 * @param timeout
 * @return {*}
 */
function lex(cg, code, timeout) {
    const timeoutTime = new Date().getTime() + timeout;
    let bestOffset = 0;
    let expected = [];
    const toVisit = [new Context(cg, 0, code, null, null)];
    while (toVisit.length > 0) {
        if ((new Date().getTime()) > timeoutTime) {
            // Timeout.
            throwSyntaxError(code, bestOffset, expected, true);
        }

        let context = toVisit.pop();

        if (!context.match()) {
            if (context.cg.type === CompiledGrammar.END && context.cg.grammar.type === "not") {
                let peer;
                if (context.cg.peer === context.previous.cg) peer = context.previous;
                else peer = context.previous.parent;
                // Special case for the "not" grammar type.
                [bestOffset, expected] = handleExpected(peer, peer.offset, [peer.cg.grammar]);
            } else {
                [bestOffset, expected] = handleExpected(context, bestOffset, expected);
            }
            continue; // Go to next context.
        }

        const nextContexts = context.getNextContexts();

        // Condition de sortie
        if (nextContexts.length === 0) {
            if (context.endOffset < code.length) {
                // Too much code.
                throwSyntaxError(code, context.endOffset, (bestOffset < context.endOffset ? [null] : expected.concat([null])));
            }

            return context.getChain();
        }

        // Contextes suivants.
        _.eachRight(nextContexts, function (nextContext) {
            // console.log("Pushing  " + nextContext.dump());
            toVisit.push(nextContext);
        });
    }

    // Syntax error.
    throwSyntaxError(code, bestOffset, expected, false);
}

module.exports = {
    lex: lex
};

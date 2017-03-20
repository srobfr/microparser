const _ = require("lodash");
const CompiledGrammar = require(__dirname + "/../CompiledGrammar.js");

function Context(cg, offset, code, parent, previous) {
    const that = this;
    that.cg = cg;
    that.parent = parent;
    that.previous = previous;
    that.offset = offset;
    that.endOffset = null;
    that.matched = null;

    that.dump = function() {
        return that.cg.dump() + " @" + that.offset + " : " + code.substr(that.offset, 30);
    };

    that.match = () => {
        const grammar = that.cg.grammar;

        if (that.cg.type === CompiledGrammar.END && grammar.type === "not") {
            if(that.cg.peer === that.previous.cg) {
                // The sub grammar did not match.
                const peer = that.previous;
                that.matched = peer.matched;
            } else {
                // Mark the peer context as non-matching
                const peer = that.previous.parent;
                peer.matched = null;
                that.matched = null;
            }
        }
        else if (that.cg.type === CompiledGrammar.END || _.isArray(grammar) || grammar.type) that.matched = true;
        else if (grammar === null) that.matched = (offset >= code.length ? true : null);
        else if (_.isString(grammar)) that.matched = (code.substr(that.offset, grammar.length) === grammar ? grammar : null);
        else if (_.isRegExp(grammar)) {
            const m = code.substr(that.offset).match(grammar);
            that.matched = (m ? m[0] : null);
        } else {
            throw new Error("Unknown grammar type : " + require("util").inspect(grammar));
        }

        that.endOffset = that.offset + (_.isString(that.matched) ? that.matched.length : 0);
        const result = (that.matched !== null);
        // console.log("Matching " + that.dump() + " : " + (result ? "OK" : "FAIL"));

        return result;
    };

    that.getNextContexts = () => {
        // If the current context is the start of a CompiledGrammar node, the next can only be :
        // - The matching end, or
        // - The start of a CompiledGrammar node.
        // If the current context is the end of a CompiledGrammar node, the next can be :
        // - The matching end of the previousContext of the matching start, or
        // - The start of a CompiledGrammar node.
        if (that.cg.type === CompiledGrammar.END && !that.parent) {
            // We reached the end.
            return [];
        }

        const nextContexts = [];
        _.each(that.cg.next, function (nextCg) {
            let nextContext = null;
            if (that.cg.type === CompiledGrammar.START) {
                if (nextCg.type === CompiledGrammar.START) {
                    // Enfant
                    nextContext = new Context(nextCg, that.endOffset, code, that, that);
                } else if (nextCg.type === CompiledGrammar.END && that.cg.peer === nextCg) {
                    // Fin du noeud courant
                    nextContext = new Context(nextCg, that.endOffset, code, that.parent, that);
                }
            } else { // that.cg.type === CompiledGrammar.END
                if (nextCg.type === CompiledGrammar.START) {
                    // Noeud suivant
                    nextContext = new Context(nextCg, that.endOffset, code, that.parent, that);
                } else if (nextCg.type === CompiledGrammar.END && that.parent.cg.peer === nextCg) {
                    // Fin du noeud parent
                    nextContext = new Context(nextCg, that.endOffset, code, that.parent.parent, that);
                }
            }

            if (nextContext) nextContexts.push(nextContext);
        });
        return nextContexts;
    };

    that.getChain = function () {
        const chain = [];
        let context = that;
        while (context) {
            chain.unshift(context);
            context = context.previous;
        }
        return chain;
    };
}

module.exports = Context;

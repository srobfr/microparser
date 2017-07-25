const _ = require("lodash");
const CompiledGrammar = require(__dirname + "/CompiledGrammar.js");
const Node = require(__dirname + "/Node.js");
const lexer = require(__dirname + "/lexer.js");

// Register the Node extensions
require(__dirname + "/nodeExtensions/search.js");

/**
 * Parser
 * @param options
 * @constructor
 */
function Parser(options) {
    const that = this;
    options = options || {};

    /**
     * Default options
     */
    _.defaultsDeep(options, {
        // Enables some integrity checks on grammar. Disabled by default to improve perfs.
        checkGrammar: false,

        // Timeout on the lexer execution, in ms.
        lexerTimeout: 5000,
    });

    /**
     * Builds a pseudo-DOM from the given contexts chain
     * @param chain
     * @returns {*}
     */
    that.buildDomFromContextsChain = function (chain) {
        const root = new Node();
        let node = root;
        _.each(chain, (context) => {
            if (context.cg.type === CompiledGrammar.END) {
                node = node.parent;
                return;
            }

            const n = new Node();

            // Grammar injection
            Object.defineProperty(n, 'grammar', {value: context.cg.grammar, enumerable: false, configurable: true, writable: true});
            // n.grammar = context.cg.grammar;

            // Parser injection
            Object.defineProperty(n, 'parser', {value: that, enumerable: false, configurable: true, writable: true});
            // n.parser = that;

            node.append(n);
            node = n;
            if (_.isString(context.matched)) n.children.push(context.matched);

            // Run the node building logic
            if (_.isFunction(node.grammar.buildNode)) node.grammar.buildNode.apply(node);
        });

        const result = _.first(root.children);
        if (result) {
            result.parent = null;
            return result;
        }

        return null;
    };

    function getDefaultCodeFromGrammar(grammar) {
        if (grammar.default !== undefined) return grammar.default;
        if (_.isString(grammar)) return grammar;
        if (_.isArray(grammar)) return _.map(grammar, getDefaultCodeFromGrammar).join("");
        if (grammar.type === "multiple") return getDefaultCodeFromGrammar(grammar.value);
        if (grammar.type === "optional" || grammar.type === "optmul") return "";
        throw new Error("No default code found for grammar : " + require("util").inspect(grammar, {depth: 30}));
    }

    that.parse = function (grammar, code) {
        if (code === undefined || code === null) code = getDefaultCodeFromGrammar(grammar);
        const cg = CompiledGrammar.build(grammar);
        if (options.checkGrammar) cg.check();
        const chain = lexer.lex(cg, code, options.lexerTimeout);
        return that.buildDomFromContextsChain(chain);
    };
}

module.exports = Parser;

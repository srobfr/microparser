const _ = require("lodash");

/**
 * Represents a compiled grammar node.
 *
 * @param type
 * @param grammar
 * @constructor
 */
function CompiledGrammar(type, grammar) {
    const that = this;
    that.grammar = grammar;
    that.uid = (CompiledGrammar.nextUid++);
    that.type = type;
    that.peer = null;
    that.next = [];
}

// Unique id counter
CompiledGrammar.nextUid = 0;

// Start type
CompiledGrammar.START = 0;

// End type
CompiledGrammar.END = 1;

/**
 * Provides a string representation of the Compiled grammar node's full path.
 */
CompiledGrammar.prototype.dump = function () {
    const op = this.type === CompiledGrammar.START ? "Start" : "End";
    return this.uid + `: ${op} ` + require("util").inspect(this.grammar, {colors: true, hidden: true, depth: 30});
};

/**
 * Provides a string representation of the Compiled grammar node's full path.
 */
CompiledGrammar.prototype.dumpPath = function () {
    const visitedNodes = new Map();
    let toVisit = [this];
    const lines = ["=== Dump for compiled grammar : " + require("util").inspect(this.grammar, {colors: true, hidden: true, depth: 30})];

    while (toVisit.length > 0) {
        let node = toVisit.pop();
        if (visitedNodes.has(node)) {
            continue;
        }
        visitedNodes.set(node, true);

        let nexts = _.map(node.next, function (next) {
            toVisit.unshift(next);
            return `(${next.uid})`;
        });

        nexts = (nexts.length > 0 ? "go to " + nexts.join(" or ") : "*Finished*.");

        lines.push(node.dump() + " then " + nexts);
    }

    return lines.join("\n");
};

/**
 * Checks the compiled grammar to detect problems.
 * This method performs a complete walkthrough of the grammar.
 */
CompiledGrammar.prototype.check = function () {
    const visitedNodes = new Map();
    const firstNode = this;
    let toVisit = [this];
    let exitNodeFound = false;
    let lastRecursiveGrammar = null;
    while (toVisit.length > 0) {
        let node = toVisit.pop();
        if (visitedNodes.has(node)) {
            // We have a recursion here.
            lastRecursiveGrammar = node.grammar;
            continue;
        }
        visitedNodes.set(node, true);
        _.each(node.next, function (next) {
            toVisit.unshift(next);
        });

        if (_.isRegExp(node.grammar) && !node.grammar.toString().match(/^\/\^/)) {
            throw new Error("Regex grammar should start with '^' : " + require("util").inspect(node.grammar, {depth: 30}));
        }

        // On a attend la fin lorsque on attend le noeud de fin correspondant au noeud de début.
        if (node.type === CompiledGrammar.END && node.peer === firstNode) exitNodeFound = true;
    }

    if (!exitNodeFound) throw new Error("No exit node found : " + require("util").inspect(lastRecursiveGrammar, {depth: 30}));
};

function valueStrategy(compiledGrammar, _compiledGrammarsByGrammar) {
    compiledGrammar.next.push(compiledGrammar.peer);
}

function sequenceStrategy(compiledGrammar, _compiledGrammarsByGrammar) {
    let prev = compiledGrammar;
    _.each(compiledGrammar.grammar, function (subGrammar) {
        const subCompiledGrammar = CompiledGrammar.build(subGrammar, _compiledGrammarsByGrammar);
        prev.next.push(subCompiledGrammar);
        prev = subCompiledGrammar.peer;
    });
    prev.next.push(compiledGrammar.peer);
}

function optionalStrategy(compiledGrammar, _compiledGrammarsByGrammar) {
    const subCompiledGrammar = CompiledGrammar.build(compiledGrammar.grammar.value, _compiledGrammarsByGrammar);
    compiledGrammar.next.push(subCompiledGrammar);
    compiledGrammar.next.push(compiledGrammar.peer); // Premature exit
    subCompiledGrammar.peer.next.push(compiledGrammar.peer);
}

function notStrategy(compiledGrammar, _compiledGrammarsByGrammar) {
    const subCompiledGrammar = CompiledGrammar.build(compiledGrammar.grammar.value, _compiledGrammarsByGrammar);
    compiledGrammar.next.push(subCompiledGrammar);
    compiledGrammar.next.push(compiledGrammar.peer); // Premature exit
    subCompiledGrammar.peer.next.push(compiledGrammar.peer);
}

function multipleStrategy(compiledGrammar, _compiledGrammarsByGrammar) {
    const subCompiledGrammar = CompiledGrammar.build(compiledGrammar.grammar.value, _compiledGrammarsByGrammar);
    compiledGrammar.next.push(subCompiledGrammar);
    if (compiledGrammar.grammar.separator === undefined) {
        subCompiledGrammar.peer.next.push(subCompiledGrammar); // Loop
    } else {
        const subCompiledSeparator = CompiledGrammar.build(compiledGrammar.grammar.separator, _compiledGrammarsByGrammar);
        subCompiledGrammar.peer.next.push(subCompiledSeparator); // Separator
        subCompiledSeparator.peer.next.push(subCompiledGrammar); // Loop
    }
    subCompiledGrammar.peer.next.push(compiledGrammar.peer); // Exit
}

function optmulStrategy(compiledGrammar, _compiledGrammarsByGrammar) {
    const subCompiledGrammar = CompiledGrammar.build(compiledGrammar.grammar.value, _compiledGrammarsByGrammar);
    compiledGrammar.next.push(subCompiledGrammar);
    compiledGrammar.next.push(compiledGrammar.peer); // Premature exit
    if (compiledGrammar.grammar.separator === undefined) {
        subCompiledGrammar.peer.next.push(subCompiledGrammar); // Loop
    } else {
        const subCompiledSeparator = CompiledGrammar.build(compiledGrammar.grammar.separator, _compiledGrammarsByGrammar);
        subCompiledGrammar.peer.next.push(subCompiledSeparator); // Separator
        subCompiledSeparator.peer.next.push(subCompiledGrammar); // Loop
    }
    subCompiledGrammar.peer.next.push(compiledGrammar.peer); // Exit
}

function orStrategy(compiledGrammar, _compiledGrammarsByGrammar) {
    _.each(compiledGrammar.grammar.value, function (subGrammar) {
        const subCompiledGrammar = CompiledGrammar.build(subGrammar, _compiledGrammarsByGrammar);
        compiledGrammar.next.push(subCompiledGrammar);
        subCompiledGrammar.peer.next.push(compiledGrammar.peer);
    });
}

CompiledGrammar.build = function (grammar, _compiledGrammarsByGrammar) {
    _compiledGrammarsByGrammar = _compiledGrammarsByGrammar || new Map();
    const cached = _compiledGrammarsByGrammar.get(grammar);
    if (cached) return cached;

    _compiledGrammarsByGrammar = new Map(_compiledGrammarsByGrammar);

    const compiledGrammarStart = new CompiledGrammar(CompiledGrammar.START, grammar);
    const compiledGrammarEnd = new CompiledGrammar(CompiledGrammar.END, grammar);
    compiledGrammarStart.peer = compiledGrammarEnd;
    compiledGrammarEnd.peer = compiledGrammarStart;

    _compiledGrammarsByGrammar.set(grammar, compiledGrammarStart);

    // Applying linking strategies
    let strategy = null;
    if (_.isString(grammar) || _.isRegExp(grammar)) strategy = valueStrategy;
    else if (_.isArray(grammar)) strategy = sequenceStrategy;
    else if (grammar && grammar.type) {
        if (grammar.type === "optional") strategy = optionalStrategy;
        if (grammar.type === "multiple") strategy = multipleStrategy;
        if (grammar.type === "optmul") strategy = optmulStrategy;
        if (grammar.type === "or") strategy = orStrategy;
        if (grammar.type === "not") strategy = notStrategy;
    }

    if (!strategy) throw new Error("Unrecognized grammar type : " + require("util").inspect(grammar));

    // Applying strategy.
    strategy(compiledGrammarStart, _compiledGrammarsByGrammar);
    return compiledGrammarStart;
};

module.exports = CompiledGrammar;

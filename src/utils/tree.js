function treeAdd(tree, ...args) {
    let t = tree;
    for (let i = 0, l = args.length; i < l; i++) {
        const a = args[i];
        if (i === (l - 1)) {
            // Here t should be a Set
            t.add(a);
        } else {
            // t is a Map
            const nt = t.get(a) || (i === l - 2 ? new Set() : new Map());
            t.set(a, nt);
            t = nt;
        }
    }
}

function treeHas(tree, ...args) {
    let t = tree;
    for (let i = 0, l = args.length; i < l; i++) {
        const a = args[i];
        if (i === (l - 1)) {
            // Here t should be a Set
            return t.has(a);
        } else {
            // t is a Map
            t = t.get(a);
            if (!t) return false;
        }
    }
}

module.exports = {
    treeAdd: treeAdd,
    treeHas: treeHas,
};

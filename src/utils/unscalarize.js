/**
 * Recursively convert scalar values into new Object instances.
 * @param value
 * @returns {{Object}}
 */
function unscalarize(value) {
    const visited = new Map();

    function copyProperties(dest, src) {
        for (let i of Object.keys(src)) {
            if (i.match(/^(\d+|or|multiple)$/)) continue;
            dest[i] = src[i];
        }
    }

    function us(value) {
        // TODO Copier les propriétés arbitraires des symboles
        let r = value;

        // Scalar values
        if (value === null) r = {null: true};
        else if (typeof value === 'string') r = new String(value);
        else if (typeof value === 'number') r = new Number(value);
        else if (typeof value === 'boolean') r = new Boolean(value);
        else {
            const alreadyVisited = visited.get(value);
            if (alreadyVisited) return alreadyVisited;

            if (Array.isArray(value)) {
                r = [];
                copyProperties(r, value);
                visited.set(value, r);
                value.forEach(v => r.push(us(v)));
                if (value.length === 0) r.push(us(''));
            } else if (value.or) {
                r = {or: []};
                copyProperties(r, value);
                visited.set(value, r);
                value.or.forEach(v => r.or.push(us(v)));
                if (value.or.length === 0) r.or.push(us(''));
            } else if (value.multiple) {
                r = {multiple: us(value.multiple)};
                copyProperties(r, value);
                visited.set(value, r);
            }
        }

        return r;
    }

    return us(value);
}


module.exports = unscalarize;

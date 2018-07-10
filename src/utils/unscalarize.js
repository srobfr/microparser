/**
 * Recursively convert scalar values into new Object instances.
 * @param value
 * @returns {{Object}}
 */
function unscalarize(value) {
    function copyProperties(dest, src) {
        for (let i of Object.keys(src)) {
            if (i.match(/^(\d+|or|multiple)$/)) continue;
            dest[i] = src[i];
        }
    }

    function us(value, visited) {
        let r = value;

        // Scalar values
        if (value === null) r = {null: true};
        else if (typeof value === 'string') r = new String(value);
        else if (typeof value === 'number') r = new Number(value);
        else if (typeof value === 'boolean') r = new Boolean(value);
        else {
            const alreadyVisited = visited.get(value);
            if (alreadyVisited) return alreadyVisited;

            visited = new Map(visited);

            if (Array.isArray(value)) {
                r = [];
                copyProperties(r, value);
                visited.set(value, r);
                value.forEach(v => r.push(us(v, visited)));
                if (value.length === 0) r.push(us('', visited));
            } else if (value.or) {
                r = {or: []};
                copyProperties(r, value);
                visited.set(value, r);
                value.or.forEach(v => r.or.push(us(v, visited)));
                if (value.or.length === 0) r.or.push(us('', visited));
            } else if (value.multiple) {
                r = {multiple: us(value.multiple, visited)};
                copyProperties(r, value);
                visited.set(value, r);
            }
        }

        return r;
    }

    return us(value, new Map());
}


module.exports = unscalarize;

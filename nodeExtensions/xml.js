const _ = require("lodash");
const Node = require(__dirname + "/../Node.js");

const xmlEscapeMap = {
    '<': '&lt;',
    '>': '&gt;',
    '&': '&amp;',
};

function escapeXml (s) {
    return s.replace(/[<>&]/g, function (c) {
        return xmlEscapeMap[c];
    });
}

Node.prototype.xml = function () {
    const childXml = this.children.map(function (child) {
        if (_.isString(child)) return escapeXml(child);
        return child.xml();
    }).join("");

    if (this.grammar.tag === undefined) return childXml;
    if (childXml.length === 0) return `<${this.grammar.tag}/>`;
    return `<${this.grammar.tag}>${childXml}</${this.grammar.tag}>`;
};
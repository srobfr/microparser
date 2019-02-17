const ParserBuilder = require('./src/dom/ParserBuilder');
const parserBuilder = new ParserBuilder();
const parser = parserBuilder.build();
const helpers = require('./src/dom/helpers');

module.exports = {
    parse: (grammar, code) => parser.parse(grammar, code),
    ...helpers
};

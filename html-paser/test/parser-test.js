var assert = require('assert');
import { parserHTML } from '../src/parser.js';
describe("parse html:", function () {
    it('<a></a>', function () {
        const tree = parserHTML('<a></a>')
        assert.equal(tree.children[0].tagName, "a");
        assert.equal(tree.children[0].children.length, 0);
    });
    it('<a href="//..."></a>', function () {
        const tree = parserHTML('<a href="//..."></a>')
        assert.equal(tree.children.length, 1);
        assert.equal(tree.children[0].children.length, 0);
    });
    it('<a href></a>', function () {
        const tree = parserHTML('<a href></a>')
        assert.equal(tree.children.length, 1);
        assert.equal(tree.children[0].children.length, 0);
    });
    it('<a href id></a>', function () {
        const tree = parserHTML('<a href id></a>')
        assert.equal(tree.children.length, 1);
        assert.equal(tree.children[0].children.length, 0);
    });
    it('<a href="abc" id></a>', function () {
        const tree = parserHTML('<a href="abc" id></a>')
        assert.equal(tree.children.length, 1);
        assert.equal(tree.children[0].children.length, 0);
    });
    it('<a id=abc></a>', function () {
        const tree = parserHTML('<a id=abc></a>')
        assert.equal(tree.children.length, 1);
        assert.equal(tree.children[0].children.length, 0);
    });
    it('<a href/>', function () {
        const tree = parserHTML('<a href/>')
        assert.equal(tree.children.length, 1);
        assert.equal(tree.children[0].children.length, 0);
    });
    it('<a id=\'abc\'/>', function () {
        const tree = parserHTML('<a id=\'abc\'/>')
        assert.equal(tree.children.length, 1);
        assert.equal(tree.children[0].children.length, 0);
    });
    it('<a />', function () {
        const tree = parserHTML('<a />')
        assert.equal(tree.children.length, 1);
        assert.equal(tree.children[0].children.length, 0);
    });
    it('<A /> upper case', function () {
        const tree = parserHTML('<A />')
        assert.equal(tree.children.length, 1);
        assert.equal(tree.children[0].children.length, 0);
    });
    // it('<style> </style>', function () {
    //     const tree = parserHTML('<style> </style>')
    //     assert.equal(tree.children.length, 1);
    //     assert.equal(tree.children[0].children.length, 0);
    // });
    // it('<>', function () {
    //     const tree = parserHTML('<>')
    //     assert.equal(tree.children.length, 1);
    //     assert.equal(tree.children[0].type, "text");
    // });
})
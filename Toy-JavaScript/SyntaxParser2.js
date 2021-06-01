import { scan } from "./LexParser.js";
let syntax = {
    Program: [
        ["StatementList", "EOF"]
    ],
    StatementList: [
        ["Statement"],
        ["StatementList", "Statement"]
    ],
    Statement: [
        ["ExpressionStatement"],
        ["IfStatement"],
        ["VariableDeclaration"],
        ["FunctionDeclaration"]
    ],
    FunctionDeclaration: [
        ["function", "Identifier", "(", ")", "{", "StatementList", "}"]
    ],
    IfStatement: [
        ["if", "(", "Expression", ")", "Statement"]
    ],
    VariableDeclaration: [
        ["var", "Identifier", ";"],
        ["let", "Identifier", ";"]
    ],
    ExpressionStatement: [
        ["Expression", ";"]
    ],
    Expression: [
        ["AssignmentExpression"]
    ],
    AssignmentExpression: [
        ["LeftHandsSideExpression", "=", "LogicalORExpression"],
        ["LogicalORExpression"]
    ],
    LogicalORExpression: [
        ["LogicalANDExpression"],
        ["LogicalORExpression", "||", "LogicalANDExpression"],
    ],
    LogicalANDExpression: [
        ["AdditiveExpression"],
        ["LogicalANDExpression", "&&", "AdditiveExpression"],
    ],
    AdditiveExpression: [
        ["MultiplicativeExpression"],
        ["AdditiveExpression", "+", "MultiplicativeExpression"],
        ["AdditiveExpression", "-", "MultiplicativeExpression"]
    ],
    MultiplicativeExpression: [
        ["LeftHandsSideExpression"],
        ["MultiplicativeExpression", "*", "LeftHandsSideExpression"],
        ["MultiplicativeExpression", "/", "LeftHandsSideExpression"]
    ],
    LeftHandsSideExpression: [
        ["CallExpression"],
        ["NewExpression"],
    ],
    CallExpression: [
        ["MemberExpression", "Arguments"],
        ["CallExpression", "Arguments"]
    ],
    NewExpression: [
        ["MemberExpression"],
        ["new", "NewExpression"]
    ],
    MemberExpression: [
        ["PrimaryExpression"],
        ["PrimaryExpression", ".", "Identifier"],
        ["PrimaryExpression", "[", "Expression", "]"],
    ],
    PrimaryExpression: [
        ["(", "Expression", ")"],
        ["Literal"],
        ["Identifier"]
    ],
    Literal: [
        ["NumericLiteral"],
        ["StringLiteral"],
        ["BooleanLiteral"],
        ["NullLiteral"],
        ["RegularExpressionLiteral"],
        ["ObjectLiteral"],
        ["ArrayLiteral"]
    ],
    ObjectLiteral: [
        ["{", "}"],
        ["{", "PropertyList", "}"]
    ],
    PropertyList: [
        ["Property"],
        ["PropertyList", ',', "Property"]
    ],
    Property: [
        ["StringLiteral", ":", "AdditiveExpression"],
        ["Identifier", ":", "AdditiveExpression"]
    ]
}

let hash = {

}

function closure(state) {
    hash[JSON.stringify(state)] = state;
    let queue = [];
    for (let symbol in state) {
        if (symbol.match(/^\$/)) {
            continue;
        }
        queue.push(symbol);
    }
    while (queue.length) {
        let symbol = queue.shift();
        // console.log(symbol);
        if (syntax[symbol]) {
            for (let rule of syntax[symbol]) {
                if (!state[rule[0]]) {
                    queue.push(rule[0]);
                }
                let current = state;
                for (let part of rule) {
                    if (!current[part]) {
                        current[part] = {}
                    }
                    current = current[part];
                }
                current.$reduceType = symbol;
                current.$reduceLength = rule.length;
            }
        }
    }
    for (let symbol in state) {
        if (symbol.match(/^\$/)) {
            continue;
        }
        if (hash[JSON.stringify(state[symbol])]) {
            state[symbol] = hash[JSON.stringify(state[symbol])];
        } else {
            closure(state[symbol]);
        }
    }
}


let end = {
    $isEnd: true
}

let start = {
    "Program": end
}

closure(start);

function parse(source) {
    let stack = [start];
    let symbolStack = [];
    function reduce() {
        let state = stack[stack.length - 1];
        if (state.$reduceType) {
            const children = [];
            for (let i = 0; i < state.$reduceLength; i++) {
                children.push(symbolStack.pop());
                stack.pop();
            }
            /* reduce to non-terminal symbols*/
            return ({
                type: state.$reduceType,
                children: children.reverse()
            });
        } else {
            throw new Error("unexpected token")
        }
    }

    function shift(symbol) {
        let state = stack[stack.length - 1];
        if (symbol.type in state) {
            stack.push(state[symbol.type]);
            symbolStack.push(symbol);
        } else {
            shift(reduce());
            shift(symbol);
        }
    }
    for (let symbol/* terminal symbols*/ of scan(source)) {
        shift(symbol);
    }

    return reduce();
}

class Realm {
    constructor() {
        this.global = new Map();
        this.Object = new Map();
        this.Object.call = function () {

        }
        this.Object_prototype = new Map();
    }
}

class EnvironmentRecord {
    constructor() {
        this.variables = new Map();
    }
}

class ExecutionContext {
    constructor() {
        this.lexicalEnvironment = {};
        this.variableEnvironment = this.lexicalEnvironment;
        this.realm = {

        }
    }
}

class Reference {
    constructor(object, property) {
        this.object = object;
        this.property = property;
    }
    set(value) {
        this.object[this.property] = value;
    }
    get() {
        return this.object[this.property];
    }
}

const evaluator = {
    Program(node) {
        return evaluate(node.children[0]);
    },
    StatementList(node) {
        if (node.children.length === 1) {
            return evaluate(node.children[0]);
        } else {
            evaluate(node.children[0]);
            return evaluate(node.children[1]);
        }
    },
    Statement(node) {
        return evaluate(node.children[0]);
    },
    VariableDeclaration(node) {
        const runningEC = ecs[ecs.length - 1];
        runningEC.variableEnvironment[node.children[1].name];
    },
    ExpressionStatement(node) {
        return evaluate(node.children[0]);
    },
    Expression(node) {
        return evaluate(node.children[0]);
    },
    AdditiveExpression(node) {
        if (node.children.length === 1) {
            return evaluate(node.children[0]);
        } else {
            // TODO
        }
    },
    MultiplicativeExpression(node) {
        if (node.children.length === 1) {
            return evaluate(node.children[0]);
        } else {
            // TODO
        }
    },
    PrimaryExpression(node) {
        if (node.children.length === 1) {
            return evaluate(node.children[0]);
        }
    },
    Literal(node) {
        return evaluate(node.children[0]);
    },
    NumericLiteral(node) {
        const str = node.value;
        let length = str.length;
        let value = 0;
        let n = 10;

        if (str.match(/^0b/)) {
            n = 2;
            length -= 2;
        } else if (str.match(/^0o/)) {
            n = 8;
            length -= 2;
        } else if (str.match(/^0x/)) {
            n = 16;
            length -= 2;
        }

        while (length--) {
            let c = str.charCodeAt(str.length - length - 1);
            if (c >= 'a'.charCodeAt(0)) {
                c = c - 'a'.charCodeAt(0) + 10;
            } else if (c >= 'A'.charCodeAt(0)) {
                c = c - 'A'.charCodeAt(0) + 10;
            } else if (c >= '0'.charCodeAt(0)) {
                c = c - '0'.charCodeAt(0);
            }
            value = value * n + c;
        }
        return value;
    },
    StringLiteral(node) {
        let result = [];
        for (let i = 1; i < node.value.length - 1; i++) {//  过滤引号
            if (node.value[i] === '\\') {
                i++;
                let c = node.value[i];
                let map = {
                    "\"": "\"",
                    "\'": "\'",
                    "\\": "\\",
                    "0": String.fromCharCode(0x0000),
                    "b": String.fromCharCode(0x0008),
                    "f": String.fromCharCode(0x000C),
                    "n": String.fromCharCode(0x000A),
                    "r": String.fromCharCode(0x000D),
                    "t": String.fromCharCode(0x0009),
                    "v": String.fromCharCode(0x000B)
                }
                if (c in map) {
                    result.push(map[c]);
                } else {
                    result.push(c);
                }
            } else {
                result.push(node.value[i]);
            }
        }
        return result.join('');
    },
    ObjectLiteral(node) {
        if (node.children.length === 2) {
            return {};
        }
        if (node.children.length === 3) {
            const object = new Map();
            this.PropertyList(node.children[1], object);
            return object;
        }
    },
    PropertyList(node, object) {
        if (node.children.length === 1) {
            this.Property(node.children[0], object);
        } else {
            this.PropertyList(node.children[0], object);
            this.Property(node.children[2], object);
        }
    },
    Property(node, object) {
        let name;
        if (node.children[0].type === 'Identifier') {
            name = node.children[0].name;
        } else if (node.children[0].type === 'StringLiteral') {
            name = evaluate(node.children[0]);
        }
        object.set(name, {
            value: evaluate(node.children[2]),
            writable: true,
            enumerable: true,
            configable: true
        });
    },
    AssignmentExpression(node) {
        if (node.children.length === 1) {
            return evaluate(node.children[0]);
        }
        const left = evaluate(node.children[0]);
        const right = evaluate(node.children[2]);
        left.set(right);
    },
    Identifier(node) {
        const runningEC = ecs[ecs.length - 1];
        return new Reference(
            runningEC.lexicalEnvironment,
            node.name
        );
    }
}

const realm = new Realm();
const ecs = [new ExecutionContext];

function evaluate(node) {
    if (evaluator[node.type]) {
        return evaluator[node.type](node);
    }
}


////////////////////////////////////

window.js = {
    evaluate, parse
}


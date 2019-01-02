import * as TOK from "./pyret-lang/pyret-tokenizer.js";
import * as P from "./pyret-lang/pyret-parser.js";
import * as TR from "./pyret-lang/translate-parse-tree.js";
import {
  AST,
  ASTNode,
  Literal,
  Sequence
} from '../../ast.js';
import {Binop, ABlank, Bind, Func,
  Sekwence,
  Var,
  Assign,
  Let
} from "./ast.js"

// TODO: This should be defined somewhere else; not sure where yet
class Position {
  constructor(from, to) {
    this.from = from;
    this.to = to;
  }
}

function startOf(srcloc) {
  return {
    "line": srcloc.startRow - 1,
    "ch":   srcloc.startCol
  }
}

function endOf(srcloc) {
  return {
    "line": srcloc.endRow - 1,
    "ch":   srcloc.endCol
  }
}

const opLookup = {
  "+":   "op+",
  "-":   "op-",
  "*":   "op*",
  "/":   "op/",
  "+":   "op+",
  "$":   "op$",
  "^":   "op^",
  "<":   "op<",
  "<=":  "op<=",
  ">":   "op>",
  ">=":  "op>=",
  "==":  "op==",
  "=~":  "op=~",
  "<=>": "op<=>",
  "<>":  "op<>",
  "and": "opand",
  "or":  "opor",
  //used in pyret-lang/translate-parse-tree.js
  "is":  function(l, node) {
    console.log('OL doing is', l, node)
    return makeNode("s-op-is", l);
  }
  // see parse-pyret.js in pyret-lang
  // TODO: check ops
}

// TODO: all of these are preliminary for testing
const nodeTypes = {
  "s-program": function(pos, prov, provTy, impt, body) {
    let rootNodes = body.exprs;
    return new AST(rootNodes);
  },
  "s-name": function(pos, str) {
    console.log('doing s-name Literal')
    return new Literal(
      pos.from,
      pos.to,
      str,
      'symbol');
  },
  "s-id": function(pos, str) {
    console.log('doing s-id Literal')
    return new Literal(
      pos.from,
      pos.to,
      str,
      'symbol');
  },
  "s-num": function(pos, x) {
    //console.log('doing s-num Literal')
    return new Literal(
      pos.from,
      pos.to,
      x,
      'number');
  },
  "s-block": function(pos, stmts) {
    //console.log('doing s-block', stmts)
    //Sequence or Sekwence?
    return new Sekwence(
      pos.from,
      pos.to,
      stmts,
      'BLOCK');
  },
  "s-user-block": function(pos, stmts) {
    console.log('doing s-user-block', stmts)
    //Sequence or Sekwence?
    return new Sekwence(
      pos.from,
      pos.to,
      stmts.exprs,
      'BLOCK');
  },
  "s-op": function(pos, opPos, op, left, right) {
    console.log('doing s-op', 'pos=', pos, 'opPos=', opPos, 'op=', op, 'left=', left, 'right=', right)
    return new Binop(
      pos.from,
      pos.to,
      op.substr(2),
      left,
      right);
  },
  's-op-is': function(pos) {
    console.log('doing s-op-is', 'pos=', pos)
    return new Literal(
      pos.from,
      pos.to,
      'is',
      'symbol')
  },
  's-check': function(pos, name, body, kwdchk) {
    //console.log('P doing s-check', 'pos=', pos, 'name=', name, 'body=', body, 'kwdchk=', kwdchk)
    //Sekw?
    return new Sequence(
      pos.from,
      pos.to,
      body.exprs,
      'CHECK')
  },
  's-check-test': function(pos, op, what, lhs, rhs) {
    //console.log('P doing s-check-test', 'pos=', pos, 'op=', op, 'what=', what, 'lhs=', lhs, 'rhs=', rhs)
    return new Binop(
      pos.from,
      pos.to,
      op,
      lhs,
      rhs)
  },
  "s-bind": function(pos, shadows, id, ann) {
    // TODO: ignoring shadowing for now.
      //console.log('doing s-bind', id)
    return new Bind(
      pos.from,
      pos.to,
      id,
      ann);
  },
  's-var': function(pos, id, rhs) {
    console.log('doing s-var', id, rhs)
    return new Var(
      pos.from,
      pos.to,
      id,
      rhs);
  },
  's-assign': function(pos, id, rhs) {
    console.log('doing s-assign', id, rhs)
    return new Var(
      pos.from,
      pos.to,
      id,
      rhs);
  },
  's-let': function(pos, id, rhs) {
    console.log('doing s-let', id, rhs)
    return new Let(
      pos.from,
      pos.to,
      id,
      rhs);
  },
  "s-fun": function(pos, name, params, args, ann, doc, body, checkLoc, check, blodky) {
    // TODO: ignoring params, check, blocky
    return new Func(
      pos.from,
      pos.to,
      name,
      args,
      ann,
      doc,
      body);
  },
  // Annotations
  "a-blank": function() {
    return new ABlank();
  },
  "a-name": function(pos, str) {
    console.log('doing a-name Literal')
    return new Literal(
      pos.from,
      pos.to,
      str,
      'symbol');
  }
}

function makeNode(nodeType) {
  const args = Array.prototype.slice.call(arguments, 1);
  const constructor = nodeTypes[nodeType];
  if (constructor === undefined) {
    console.log("Warning: node type", nodeType, "NYI");
    return;
  } else {
    return constructor.apply(this, args);
  }
}

function makeSrcloc(fileName, srcloc) {
  return new Position(startOf(srcloc), endOf(srcloc));
}

function combineSrcloc(fileName, startPos, endPos) {
  return new Position(startOf(startPos), endOf(endPos));
}

function translateParseTree(parseTree, fileName) {
  function NYI(msg) {
    return function() {
      console.log(msg, "not yet implemented");
    }
  }
  const constructors = {
    "makeNode": makeNode,
    "opLookup": opLookup,
    "makeLink": function(a, b) {
      b.push(a); // Probably safe?
      return b;
    },
    "makeEmpty": function() {
      return new Array();
    },
    "makeString": function(str) {
      return str;
    },
    "makeNumberFromString": function(str) {
      // TODO: error handling
      return parseFloat(str);
    },
    "makeBoolean": function(bool) {
      return bool;
    },
    "makeNone": function() {
      return null;
    },
    "makeSome": function(value) {
      return value;
    },
    "getRecordFields": NYI("getRecordFields"),
    "makeSrcloc": makeSrcloc,
    "combineSrcloc": combineSrcloc,
    "detectAndComplainAboutOperatorWhitespace": function(kids, fileName) {
      return;
    }
  };
  return TR.translate(parseTree, fileName, constructors);
}

export class PyretParser {
  // TODO: Proper error handling.
  //       See `pyret-lang/src/js/trove/parse-pyret.js`.
  parse(text) {
    // Tokenize
    const tokenizer = TOK.Tokenizer;
    tokenizer.tokenizeFrom(text);
    // Parse
    const parsed = P.PyretGrammar.parse(tokenizer);
    if (parsed) {
      // Count parse trees
      const countParses = P.PyretGrammar.countAllParses(parsed);
      if (countParses === 1) {
        // Construct parse tree
        const parseTree = P.PyretGrammar.constructUniqueParse(parsed);
        // Translate parse tree to AST
        const ast = translateParseTree(parseTree, "<editor>.arr");
        return ast;
      } else {
        throw "Multiple parses";
      }
    } else {
      console.log("Invalid parse");
      console.log("Next token is " + tokens.curTok.toRepr(true)
                  + " at " + tokens.curTok.pos.toString(true));
    }
  }
}

module.exports = PyretParser;

function testRun() {
  const data = `
  fun foo(x :: Number):
  x + 3
  end
  `
  const ast = parsePyret(data);
  console.log("\nBlocky AST:\n");
  console.log(ast.toString());
  console.log("\nBlocky AST (JS view):\n");
  console.log(ast);
}

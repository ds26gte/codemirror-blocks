import {ASTNode, pluralize, descDepth, enumerateList} from '../../ast';

// TODO: toDescription

export class Binop extends ASTNode {
  constructor(from, to, op, left, right, options={}) {
    super(from, to, 'binop', ['left', 'right'], options);
    this.op = op;
    this.left = left;
    this.right = right;
  }
  toString() {
    return `(${this.op} ${this.left} ${this.right})`;
  }
}

export class ABlank extends ASTNode {
  constructor(from, to, options={}) {
    super(from, to, 'a-blank', [], options);
  }
  toString() {
    return `Any`;
  }
}

export class Bind extends ASTNode {
  constructor(from, to, id, ann, options={}) {
    super(from, to, 'bind', ['ann'], options);
    this.id = id;
    this.ann = ann;
  }
  toString() {
    return `(bind ${this.id} ${this.ann})`;
  }
}

export class Func extends ASTNode {
  constructor(from, to, name, args, retAnn, doc, body, options={}) {
    super(from, to, 'func', ['args', 'retAnn', 'body'], options);
    this.name = name;
    this.args = args;
    this.retAnn = retAnn;
    this.doc = doc;
    this.body = body;
  }
  toString() {
    return `(fun (${this.args.join(" ")}) ${this.retAnn} "${this.doc}" ${this.body})`;
  }
}

export class Sekwence extends ASTNode {
  constructor(from, to, exprs, name, options={}) {
    console.log('constructing Sekwence', from, to, exprs, name)
    super(from, to, 'sekwence', ['exprs'], options);
    this.exprs = exprs;
    this.name = name;
  }

  toDescription(level) {
    if((this['aria-level'] - level) >= descDepth) return this.options['aria-label'];
    return `a sequence containing ${enumerateList(this.exprs, level)}`;
  }

  toString() {
    return `block: ${this.exprs.join(" ")} end`;
  }
}

export class Var extends ASTNode {
  constructor(from, to, id, rhs, options={}) {
    super(from, to, 'var', ['id', 'rhs'], options);
    this.id = id;
    this.rhs = rhs;
  }


  toDescription(level) {
    if((this['aria-level'] - level) >= descDepth) return this.options['aria-label'];
    return `a var setting ${this.id} to ${this.rhs}`;
  }

  toString() {
    return `var ${this.id} === ${this.rhs}`;
  }

}

export class Assign extends ASTNode {
  constructor(from, to, id, rhs, options={}) {
    super(from, to, 'assign', ['id', 'rhs'], options);
    this.id = id;
    this.rhs = rhs;
  }


  toDescription(level) {
    if((this['aria-level'] - level) >= descDepth) return this.options['aria-label'];
    return `an assignment setting ${this.id} to ${this.rhs}`;
  }

  toString() {
    return `${this.id} := ${this.rhs}`;
  }

}

export class Let extends ASTNode {
  constructor(from, to, id, rhs, options={}) {
    super(from, to, 'let', ['id', 'rhs'], options);
    this.id = id;
    this.rhs = rhs;
  }


  toDescription(level) {
    if((this['aria-level'] - level) >= descDepth) return this.options['aria-label'];
    return `a let setting ${this.id} to ${this.rhs}`;
  }

  toString() {
    return `${this.id} = ${this.rhs}`;
  }

}

// TODO: Why does this not work if I just say `export class ...`?
module.exports = {
  'Binop': Binop,
  'ABlank': ABlank,
  'Bind': Bind,
  'Func': Func,
  'Sekwence': Sekwence,
  'Var': Var,
  'Assign': Assign,
  'Let': Let
};

import {ASTNode, pluralize, descDepth} from '../../ast';

export class LetLikeExpr extends ASTNode {
  constructor(from, to, form, bindings, expr, options={}) {
    super(from, to, 'letLikeExpr', ['bindings', 'expr'], options);
    this.form = form;
    this.bindings = bindings;
    this.expr = expr;
  }

  toDescription(level){
    if((this['aria-level']- level) >= descDepth) return this.options['aria-label'];
    return `a ${this.form} expression with ${pluralize("binding", this.bindings.exprs)}`;
  }

  toString() {
    return `(${this.form} (${this.bindings.toString()}) ${this.expr.toString()}`;
  }
}

export class WhenUnless extends ASTNode {
  constructor(from, to, form, predicate, exprs, options={}) {
    super(from, to, 'whenUnlessExpr', ['predicate', 'exprs'], options);
    this.form = form;
    this.predicate = predicate;
    this.exprs = exprs;
  }

  toDescription(level){
    if((this['aria-level']- level) >= descDepth) return this.options['aria-label'];
    return `a ${this.form} expression: ${this.form} ${this.predicate.toDescription(level)}, ${this.exprs.toDescription(level)}`;
  }

  toString() {
    return `(${this.form} (${this.predicate.toString()}) ${this.exprs.toString()})`;
  }
}

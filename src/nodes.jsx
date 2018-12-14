import * as P from './pretty';
import React from 'react';
import {ASTNode, descDepth, enumerateList, pluralize} from './ast';
import hashObject from 'object-hash';
import Node from './components/Node';
import Args from './components/Args';
import BlockComponent from './components/BlockComponent';
import DropTarget from './components/DropTarget';


export class Unknown extends ASTNode {
  constructor(from, to, elts, options={}) {
    super(from, to, 'unknown', ['elts'], options);
    this.elts = elts;
    this.hash = hashObject(['unknown', elts.map(elt => elt.hash)]);
  }

  toDescription(level){
    if((this.level - level) >= descDepth) return this.options['aria-label'];
    return `an unknown expression with ${pluralize("children", this.elts)} `+ 
      this.elts.map((e, i, elts)  => (elts.length>1? (i+1) + ": " : "")+ e.toDescription(level)).join(", ");
  }

  pretty() {
    return P.standardSexpr(this.elts[0], this.elts.slice(1));
  }

  render(props) {
    const {helpers, lockedTypes} = props;
    const firstElt = this.elts[0];
    const restElts = this.elts.slice(1);
    return (
      <Node node={this} lockedTypes={lockedTypes} helpers={helpers}>
        <span className="blocks-operator">{helpers.renderNodeForReact(firstElt)}</span>
        <span className="blocks-args">
          <Args helpers={helpers} location={firstElt.to}>{restElts}</Args>
        </span>
      </Node>
    );
  }
}

export class FunctionApp extends ASTNode {
  constructor(from, to, func, args, options={}) {
    super(from, to, 'functionApp', ['func', 'args'], options);
    this.func = func;
    this.args = args;
    this.hash = hashObject(['function-app', func.hash, args.map(arg => arg.hash)]);
  }

  toDescription(level){
    // if it's the top level, enumerate the args
    if((this.level  - level) == 0) {
      return `applying the function ${this.func.toDescription()} to ${pluralize("argument", this.args)} `+
      this.args.map((a, i, args)  => (args.length>1? (i+1) + ": " : "")+ a.toDescription(level)).join(", ");
    }
    // if we've bottomed out, use the aria label
    if((this.level  - level) >= descDepth) return this.options['aria-label'];
    // if we're in between, use "f of A, B, C" format
    else return `${this.func.toDescription()} of `+ this.args.map(a  => a.toDescription(level)).join(", ");
      
  }

  pretty() {
    return P.standardSexpr(this.func, this.args);
  }

  render(props) {
    const {helpers, lockedTypes} = props;
    return (
      <Node node={this} lockedTypes={lockedTypes} helpers={helpers}>
        <span className="blocks-operator">
          <Args helpers={helpers}>{[this.func]}</Args>
        </span>
        <span className="blocks-args">
          <Args helpers={helpers} location={this.func.to}>{this.args}</Args>
        </span>
      </Node>
    );
  }
}

export class IdentifierList extends ASTNode {
  constructor(from, to, kind, ids, options={}) {
    super(from, to, 'identifierList', ['ids'], options);
    this.kind = kind;
    this.ids = ids;
    this.hash = hashObject(['identifierList', this.kind, this.ids.map(id => id.hash)]);
  }

  toDescription(level){
    if((this.level  - level) >= descDepth) return this.options['aria-label'];
    return enumerateList(this.ids, level);
  }

  pretty() {
    return P.spaceSep(this.ids);
  }

  render(props) {
    const {helpers, lockedTypes} = props;
    return (
      <Node node={this} lockedTypes={lockedTypes} helpers={helpers}>
        <span className="blocks-args">
          <Args helpers={helpers} location={this.from}>{this.ids}</Args>
        </span>
      </Node>
    );
  }
}

export class StructDefinition extends ASTNode {
  constructor(from, to, name, fields, options={}) {
    super(from, to, 'structDefinition', ['name', 'fields'], options);
    this.name = name;
    this.fields = fields;
    this.hash = hashObject(['structDefinition', name.hash, fields.hash]);
  }

  toDescription(level){
    if((this.level  - level) >= descDepth) return this.options['aria-label'];
    return `define ${this.name.toDescription(level)} to be a structure with
            ${this.fields.toDescription(level)}`;
  }

  pretty() {
    return P.lambdaLikeSexpr("define-struct", this.name, P.parens(this.fields));
  }

  render(props) {
    const {helpers, lockedTypes} = props;
    return (
      <Node node={this} lockedTypes={lockedTypes} helpers={helpers}>
        <span className="blocks-operator">
          define-struct
          <Args helpers={helpers}>{[this.name]}</Args>
        </span>
        {helpers.renderNodeForReact(this.fields)}
      </Node>
    );
  }
}

export class VariableDefinition extends ASTNode {
  constructor(from, to, name, body, options={}) {
    super(from, to, 'variableDefinition', ['name', 'body'], options);
    this.name = name;
    this.body = body;
    this.hash = hashObject(['variableDefinition', name.hash, body.hash]);
  }

  toDescription(level){
    if((this.level  - level) >= descDepth) return this.options['aria-label'];
    let insert = ["literal", "blank"].includes(this.body.type)? "" : "the result of:";
    return `define ${this.name} to be ${insert} ${this.body.toDescription(level)}`;
  }

  pretty() {
    return P.lambdaLikeSexpr("define", this.name, this.body);
  }

  render(props) {
    const {helpers, lockedTypes} = props;
    return (
      <Node node={this} lockedTypes={lockedTypes} helpers={helpers}>
        <span className="blocks-operator">
          define
          <Args helpers={helpers}>{[this.name]}</Args>
        </span>
        <span className="blocks-args">
          {helpers.renderNodeForReact(this.body)}
        </span>
      </Node>
    );
  }
}

export class LambdaExpression extends ASTNode {
  constructor(from, to, args, body, options={}) {
    super(from, to, 'lambdaExpression', ['args', 'body'], options);
    this.args = args;
    this.body = body;
    this.hash = hashObject(['lambdaExpression', args.hash, body.hash]);
  }

  toDescription(level){
    if((this.level  - level) >= descDepth) return this.options['aria-label'];
    return `an anonymous function of ${pluralize("argument", this.args.ids)}: 
            ${this.args.toDescription(level)}, with body:
            ${this.body.toDescription(level)}`;
  }

  pretty() {
    return P.lambdaLikeSexpr("lambda", P.parens(this.args), this.body);
  }

  render(props) {
    const {helpers, lockedTypes} = props;
    return (
      <Node node={this} lockedTypes={lockedTypes} helpers={helpers}>
        <span className="blocks-operator">
          &lambda; (
          {helpers.renderNodeForReact(this.args)}
          )
        </span>
        <span className="blocks-args">
          {helpers.renderNodeForReact(this.body)}
        </span>
      </Node>
    );
  }
}

export class FunctionDefinition extends ASTNode {
  constructor(from, to, name, params, body, options={}) {
    super(from, to, 'functionDefinition', ['name', 'params', 'body'], options);
    this.name = name;
    this.params = params;
    this.body = body;
    this.hash = hashObject(['functionDefinition', name.hash, params.hash, body.hash]);
  }

  toDescription(level){
    if((this.level  - level) >= descDepth) return this.options['aria-label'];
    return `define ${this.name} to be a function of 
            ${this.params.toDescription(level)}, with body:
            ${this.body.toDescription(level)}`;
  }

  pretty() {
    return P.lambdaLikeSexpr(
      "define",
      P.standardSexpr(this.name, this.params),
      this.body);
  }

  render(props) {
    const {helpers, lockedTypes} = props;
    return (
      <FunctionDefinitionComponent helpers={helpers} lockedTypes={lockedTypes} node={this}>
        {props.children}
      </FunctionDefinitionComponent>
    );
  }
}

class FunctionDefinitionComponent extends BlockComponent {
  state = {editableList: {}}
  handleSetEditableArr = {}
  handleSetEditable = i => {
    if (!this.handleSetEditableArr[i]) {
      this.handleSetEditableArr[i] = b => {
        this.setState({editableList: {...this.state.editableList, [i]: b}});
      };
    }
    return this.handleSetEditableArr[i];
  }

  render() {
    const {node, helpers, lockedTypes} = this.props;
    return (
      <Node node={node} lockedTypes={lockedTypes} helpers={helpers}>
        <span className="blocks-operator">
          define (
          <DropTarget location={node.name.from}
                      editable={this.state.editableList[0]}
                      onSetEditable={this.handleSetEditable(0)} />
          {helpers.renderNodeForReact(node.name)}
          {helpers.renderNodeForReact(node.params)}
          )
        </span>
        <span className="blocks-args">
          {helpers.renderNodeForReact(node.body)}
        </span>
      </Node>
    );
  }
}

export class CondClause extends ASTNode {
  constructor(from, to, testExpr, thenExprs, options={}) {
    super(from, to, 'condClause', ['testExpr', 'thenExprs'], options);
    this.testExpr = testExpr;
    this.thenExprs = thenExprs;
    this.hash = hashObject(['condClause', testExpr.hash, thenExprs.map(e => e.hash)]);
  }

  toDescription(level){
    if((this.level  - level) >= descDepth) return this.options['aria-label'];
    return `condition: if ${this.testExpr.toDescription(level)}, then, ${this.thenExprs.map(te => te.toDescription(level))}`;
  }

  pretty() {
    return P.brackets(P.spaceSep([this.testExpr].concat(this.thenExprs)));
  }

  render(props) {
    const {helpers, lockedTypes} = props;
    return (
      <CondClauseComponent helpers={helpers} lockedTypes={lockedTypes} node={this}>
        {props.children}
      </CondClauseComponent>
    );
  }
}

class CondClauseComponent extends BlockComponent {
  state = {editableList: {}}
  handleSetEditableArr = {}
  handleSetEditable = i => {
    if (!this.handleSetEditableArr[i]) {
      this.handleSetEditableArr[i] = b => {
        this.setState({editableList: {...this.state.editableList, [i]: b}});
      };
    }
    return this.handleSetEditableArr[i];
  }

  render() {
    const {node, helpers, lockedTypes} = this.props;
    return (
      <Node node={node} lockedTypes={lockedTypes} helpers={helpers}>
        <div className="blocks-cond-row">
          <div className="blocks-cond-predicate">
            <DropTarget location={node.testExpr.from}
                        editable={this.state.editableList[0]}
                        onSetEditable={this.handleSetEditable(0)} />
             {helpers.renderNodeForReact(node.testExpr)}
          </div>
          <div className="blocks-cond-result">
            {node.thenExprs.map((thenExpr, index) => (
              <span key={index}>
                <DropTarget location={thenExpr.from}
                            editable={this.state.editableList[index+1]}
                            onSetEditable={this.handleSetEditable(index+1)} />
                {helpers.renderNodeForReact(thenExpr)}
              </span>))}
          </div>
        </div>
        <DropTarget
          location={node.from}
          editable={this.state.editableList[node.thenExprs.length + 1]}
          onSetEditable={this.handleSetEditable(node.thenExprs.length + 1)} />
      </Node>
    );
  }
}

export class CondExpression extends ASTNode {
  constructor(from, to, clauses, options={}) {
    super(from, to, 'condExpression', ['clauses'], options);
    this.clauses = clauses;
    this.hash = hashObject(['condExpression', this.clauses.map(clause => clause.hash)]);
  }

  toDescription(level){
    if((this.level  - level) >= descDepth) return this.options['aria-label'];
    return `a conditional expression with ${pluralize("condition", this.clauses)}: 
            ${this.clauses.map(c => c.toDescription(level))}`;
  }

  pretty() {
    return P.beginLikeSexpr("cond", this.clauses);
  }

  render(props) {
    const {helpers, lockedTypes} = props;
    return (
      <Node node={this} lockedTypes={lockedTypes} helpers={helpers}>
        <span className="blocks-operator">cond</span>
        <div className="blocks-cond-table">
          {this.clauses.map((clause, index) => helpers.renderNodeForReact(clause, index)) }
        </div>
      </Node>
    );
  }
}

export class IfExpression extends ASTNode {
  constructor(from, to, testExpr, thenExpr, elseExpr, options={}) {
    super(from, to, 'ifExpression', ['testExpr', 'thenExpr', 'elseExpr'], options);
    this.testExpr = testExpr;
    this.thenExpr = thenExpr;
    this.elseExpr = elseExpr;
    this.hash = hashObject(['ifExpression', testExpr.hash, thenExpr.hash, elseExpr.hash]);
  }

  toDescription(level){
    if((this.level  - level) >= descDepth) return this.options['aria-label'];
    return `an if expression: if ${this.testExpr.toDescription(level)}, then ${this.thenExpr.toDescription(level)} `+
            `else ${this.elseExpr.toDescription(level)}`;
  }

  pretty() {
    return P.standardSexpr("if", [this.testExpr, this.thenExpr, this.elseExpr]);
  }

  render(props) {
    const {helpers, lockedTypes} = props;
    return (
      <IfExpressionComponent helpers={helpers} lockedTypes={lockedTypes} node={this}>
        {props.children}
      </IfExpressionComponent>
    );
  }
}

class IfExpressionComponent extends BlockComponent {
  state = {editableList: {}}
  handleSetEditableArr = {}
  handleSetEditable = i => {
    if (!this.handleSetEditableArr[i]) {
      this.handleSetEditableArr[i] = b => {
        this.setState({editableList: {...this.state.editableList, [i]: b}});
      };
    }
    return this.handleSetEditableArr[i];
  }

  render() {
    const {node, helpers, lockedTypes} = this.props;
    return (
      <Node node={node} lockedTypes={lockedTypes} helpers={helpers}>
        <span className="blocks-operator">if</span>
        <div className="blocks-cond-table">
          <div className="blocks-cond-row">
            <div className="blocks-cond-predicate">
              <DropTarget location={node.testExpr.from}
                          editable={this.state.editableList[0]}
                          onSetEditable={this.handleSetEditable(0)} />
              {helpers.renderNodeForReact(node.testExpr)}
            </div>
            <div className="blocks-cond-result">
              <DropTarget location={node.thenExpr.from}
                          editable={this.state.editableList[1]}
                          onSetEditable={this.handleSetEditable(1)} />
              {helpers.renderNodeForReact(node.thenExpr)}
            </div>
          </div>
          <div className="blocks-cond-row">
            <div className="blocks-cond-predicate blocks-cond-else">
              else
            </div>
            <div className="blocks-cond-result">
              <DropTarget location={node.elseExpr.from}
                          editable={this.state.editableList[2]}
                          onSetEditable={this.handleSetEditable(2)} />
              {helpers.renderNodeForReact(node.elseExpr)}
            </div>
            <div className="blocks-cond-result">
              <DropTarget location={node.elseExpr.to}
                          editable={this.state.editableList[3]}
                          onSetEditable={this.handleSetEditable(3)} />
            </div>
          </div>
        </div>
      </Node>
    );
  }
}

export class Literal extends ASTNode {
  constructor(from, to, value, dataType='unknown', options={}) {
    super(from, to, 'literal', [], options);
    this.value = value;
    this.dataType = dataType;
    this.hash = hashObject(['literal', this.value, this.dataType]);
  }

  pretty() {
    return P.txt(this.value);
  }

  render(props) {
    const {helpers, lockedTypes} = props;
    return (
      <Node node={this}
            lockedTypes={lockedTypes}
            normallyEditable={true}
            expandable={false}
            helpers={helpers}>
        <span className={`blocks-literal-${this.dataType}`}>
          {this.value.toString()}
        </span>
      </Node>
    );
  }
}

export class Comment extends ASTNode {
  constructor(from, to, comment, options={}) {
    super(from, to, 'comment', [], options);
    this.comment = comment;
    this.hash = hashObject(['comment', this.comment]);
  }

  pretty() {
    return P.wrap(this.comment.split(/\s+/));
  }

  render(props) {
    return (<span className="blocks-comment" id={this.id} aria-hidden="true">
      <span className="screenreader-only">Has comment,</span> {this.comment.toString()}
    </span>);
  }
}

export class Blank extends ASTNode {
  constructor(from, to, value, dataType='blank', options={}) {
    super(from, to, 'blank', [], options);
    this.value = value || "...";
    this.dataType = dataType;
    this.hash = hashObject(['blank', this.value, this.dataType]);
  }

  pretty() {
    return P.txt(this.value);
  }

  render(props) {
    const {helpers, lockedTypes} = props;
    return (
      <Node node={this}
            lockedTypes={lockedTypes}
            normallyEditable={true}
            expandable={false}
            helpers={helpers}>
        <span className="blocks-literal-symbol" />
      </Node>
    );
  }
}

export class Sequence extends ASTNode {
  constructor(from, to, exprs, name, options={}) {
    super(from, to, 'sequence', ['exprs'], options);
    this.exprs = exprs;
    this.name = name;
    this.hash = hashObject(['sequence', this.name, this.exprs.map(expr => expr.hash)]);
  }

  toDescription(level) {
    if((this.level  - level) >= descDepth) return this.options['aria-label'];
    return `a sequence containing ${enumerateList(this.exprs, level)}`;
  }

  pretty() {
    return P.standardSexpr(this.name, this.exprs);
  }

  render(props) {
    const {helpers, lockedTypes} = props;
    return (
      <Node node={this} lockedTypes={lockedTypes} helpers={helpers}>
        <span className="blocks-operator">{this.name}</span>
        <div className="blocks-sequence-exprs">
          <Args helpers={helpers} location={this.name.to}>{this.exprs}</Args>
        </div>
      </Node>
    );
  }
}

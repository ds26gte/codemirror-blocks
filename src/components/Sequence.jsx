import React, {Component} from 'react';
import PropTypes from 'prop-types';

import {Sequence as ASTSequenceNode} from '../ast';
import Node from './Node';
import DropTarget from './DropTarget';

export default class Sequence extends Component {
  static propTypes = {
    node: PropTypes.instanceOf(ASTSequenceNode).isRequired,
    helpers: PropTypes.shape({
      renderNodeForReact: PropTypes.func.isRequired,
    }).isRequired,
    lockedTypes: PropTypes.instanceOf(Array).isRequired,
  }

  render() {
    const {node, helpers, lockedTypes} = this.props;
    const exprNodes = [];
    //console.log('Sequence/node=', node)
    //console.log('Sequence/node.exprs=', node.exprs)
    node.exprs.forEach((expr, index) => {
      exprNodes.push(helpers.renderNodeForReact(expr, 'node-'+index));
      exprNodes.push(
        <DropTarget location={expr.to} />
      );
    });
    return (
      <Node node={node} lockedTypes={lockedTypes} helpers={helpers}>
        <span className="blocks-operator">{node.name}</span>
        <div className="blocks-sequence-exprs">
          <DropTarget location={node.exprs.length ? node.exprs[0].from : node.to} />
          {exprNodes}
        </div>
      </Node>
    );
  }
}

import React, {Component} from 'react';
import PropTypes from 'prop-types';

import {Sekwence as ASTSekwenceNode} from '../ast';
import Node from '../../../components/Node';
import DropTarget from '../../../components/DropTarget';

export default class Sekwence extends Component {
  static propTypes = {
    node: PropTypes.instanceOf(ASTSekwenceNode).isRequired,
    helpers: PropTypes.shape({
      renderNodeForReact: PropTypes.func.isRequired,
    }).isRequired,
    lockedTypes: PropTypes.instanceOf(Array).isRequired,
  }

  render() {
    const {node, helpers, lockedTypes} = this.props;
    const exprNodes = [];
    console.log('Sekwence/node=', node)
    // node.exprs seems to be in reverse!
     // var nexprs = node.exprs.slice().reverse()
    var nexprs = node.exprs.slice().reverse();
    console.log('Sekwence/node.exprs=', node.exprs)
    console.log('Sekwence/nexprs=', nexprs)
    var  jk = node.exprs.length-1
    console.log('jk=', jk)

    console.log('node.exprs[0].from=', node.exprs[0].from)
    console.log('node.exprs[last].from=', node.exprs[jk].from)
    console.log('node.name=', node.name)
    console.log('node.to=', node.to)

    
    nexprs.forEach((expr, index) => {
      exprNodes.push(helpers.renderNodeForReact(expr, 'node-'+index));
      exprNodes.push(
        <DropTarget location={expr.to} />
      );
    });
    console.log('returning from Sekw/render')
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

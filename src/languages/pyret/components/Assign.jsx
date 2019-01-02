
import React, {Component} from 'react';
import PropTypes from 'prop-types';

import {Assign as AssignNode} from '../ast';
import Node from '../../../components/Node';
import DropTarget from '../../../components/DropTarget';

export default class Assign extends Component {
  // Boilerplate
  static propTypes = {
    node: PropTypes.instanceOf(AssignNode).isRequired,
    helpers: PropTypes.shape({
      renderNodeForReact: PropTypes.func.isRequired
    }).isRequired,
    lockedTypes: PropTypes.instanceOf(Array).isRequired
  }

  // TODO: DropTarget locations
  render() {
    const {node, helpers, lockedTypes} = this.props;
    //console.log('rendering Assign' , node)
    return (
      <Node node={node} lockedTypes={lockedTypes} helpers={helpers}>
        <span className="blocks-operator">
          <DropTarget/>
          :=
          <DropTarget/>
        </span>
        <span className="blocks-args">
          <DropTarget location={node.id.from} key={'drop-0'} />
          {helpers.renderNodeForReact(node.id)}
          <DropTarget location={node.id.to}   key={'drop-1'} />
          {helpers.renderNodeForReact(node.rhs)}
          <DropTarget location={node.rhs.to}  key={'drop-2'} />
        </span>
      </Node>
    );
  }
}

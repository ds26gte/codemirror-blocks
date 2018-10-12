import 'babel-polyfill';
import {renderEditorInto, renderToolbarInto} from '../src/ui';
import CodeMirrorBlocks from './blocks';
import PyretParser from './languages/pyret/PyretParser.js';
CodeMirrorBlocks.ast = require('./ast');
CodeMirrorBlocks.parsers = {
  pyret: (...args) => new PyretParser(...args)
};
CodeMirrorBlocks.CodeMirror = require('codemirror');
module.exports = CodeMirrorBlocks;

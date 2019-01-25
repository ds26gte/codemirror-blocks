import React from 'react';
import ReactDOM from 'react-dom';
import ToggleEditor from './ui/ToggleEditor';
import pyret from '../src/languages/pyret';

// Consumes a DOM node to host the editor, a language object and the code
// to render. Produces an object-representation of CMB, allowing for
// integration with external (non-react) code
export class CodeMirrorBlocks {
  constructor(dom, language = pyret, code = "") {
    let obj = {};
    ReactDOM.render(
      <ToggleEditor language={language} initialCode={code} external={obj} />,
      dom
    );
    return obj;
  }
}

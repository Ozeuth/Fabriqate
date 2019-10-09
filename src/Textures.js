import React from 'react';
import {styles} from "./Render";

export default class Textures extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      texturePanelFocal: null
    }
  }

  render() {
    return (
      <button style={{top: '0%', left: '0%', position: 'absolute'}}>Test</button>
    );
  }
}
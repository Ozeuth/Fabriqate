import React from 'react';
import {styles, TextureType} from "./Render";

export default class Textures extends React.Component {
  // --- UI CONTROL --- //
  constructor(props) {
    super(props);
    this.state = {
      texturePanelVisibility: 'hidden',
      texturePanelFocal: this.props.materialPanelFocal ?
        window.textures.get(Textures.getMeshFromName(this.props.materialPanelFocal)).color : null,
      textureTypeFocal: TextureType.COLOR
    };
    this.toggleTextures = this.toggleTextures.bind(this);
    this.switchTexture = this.switchTexture.bind(this);
  }

  toggleTextures() {
    const visibility = this.state.texturePanelVisibility === "hidden" ? "visible" : "hidden";
    this.setState({
      texturePanelVisibility: visibility,

    })
  }

  switchTexture(event) {
    this.setState({
      textureTypeFocal: event.target.id.replace("Button", "")
    });
  }

  // --- HELPER FUNCTIONS --- //
  static getMeshFromName(meshName) {
    let mesh = null;
    const allMeshes = Array.from(window.textures.keys());
    allMeshes.forEach(found => {
      if (meshName === found.name) {mesh = found}
    });
    return mesh;
  }


  // --- RENDER CONTROL --- //
  render() {
    return (
      <div>
        <button style={{...styles.default_button, ...{left: '10%', top: '6%'}}} onClick={this.toggleTextures}> Textures </button>
        <div id="texturesPanel" style={{...styles.panel, ...{left: '10%', top: 'calc(6% + 25px)', visibility: this.state.texturePanelVisibility}}}>
          <div id="textureButtons" style={{textAlign: 'center', display: 'inline-block'}}>
            <button id="colorButton" style={styles.default_button} onClick={this.switchTexture}>Color</button>
            <button id="aoButton" style={styles.default_button} onClick={this.switchTexture}>AO</button>
            <button id="roughButton" style={styles.default_button} onClick={this.switchTexture}>Roughness</button>
            <button id="metalButton" style={styles.default_button} onClick={this.switchTexture}>Metal</button>
            <button id="normalButton" style={styles.default_button} onClick={this.switchTexture}>Normal</button>
          </div>
        </div>
      </div>
    );
  }
}
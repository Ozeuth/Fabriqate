import React from 'react';
import {styles, TextureType} from "./Render";

export default class Textures extends React.PureComponent {
  // --- UI CONTROL --- //
  constructor(props) {
    super(props);
    this.state = {
      texturePanelVisibility: 'hidden',
      textureTypeFocal: TextureType.COLOR
    };
    this.toggleTextures = this.toggleTextures.bind(this);
    this.switchTexture = this.switchTexture.bind(this);
  }

  toggleTextures() {
    const visibility = this.state.texturePanelVisibility === "hidden" ? "visible" : "hidden";
    this.setState({
      texturePanelVisibility: visibility
    })
  }

  switchTexture(event) {
    this.setState({
      textureTypeFocal: event.target.id.replace("Button", "")
    })
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

  static getTextureFromInfo(textureInfo, textureType) {
    if (!textureInfo) {return null}
    switch (textureType) {
      case TextureType.COLOR:
        return textureInfo.color;
      case TextureType.AO:
        return textureInfo.ao;
      case TextureType.ROUGH:
        return textureInfo.rough;
      case TextureType.METAL:
        return textureInfo.metal;
      case TextureType.NORMAL:
        return textureInfo.normal;
      default:
        return null;
    }
  }
  // --- RENDER CONTROL --- //
  render() {
    let mesh = (window.textures) ? (Array.from(window.textures.keys()).filter(found => found.name === this.props.materialPanelFocal) ?
      Array.from(window.textures.keys()).filter(found => found.name === this.props.materialPanelFocal)[0] : null) : null;
    const focalTexture = window.textures && mesh ?
      (this.state.textureTypeFocal === TextureType.COLOR ? window.textures.get(mesh).color :
        (this.state.textureTypeFocal === TextureType.AO ? window.textures.get(mesh).ao :
          (this.state.textureTypeFocal === TextureType.ROUGH ? window.textures.get(mesh).rough :
            (this.state.textureTypeFocal === TextureType.METAL ? window.textures.get(mesh).metal :
              (this.state.textureTypeFocal === TextureType.NORMAL ? window.textures.get(mesh).normal :
                null)))))
      : null;

    return (
      <div>
        <button style={{...styles.default_button, ...{left: '10%', top: '6%'}}} onClick={this.toggleTextures}> Textures </button>
        <div id="texturesPanel" style={{...styles.panel, ...{left: '10%', top: 'calc(6% + 25px)', visibility: this.state.texturePanelVisibility}}}>
          <div id="textureButtons" style={{textAlign: 'center', display: 'inline-block'}}>
            <button id="colorButton" style={styles.small_button} onClick={this.switchTexture}>Color</button>
            <button id="aoButton" style={styles.small_button} onClick={this.switchTexture}>AO</button>
            <button id="roughButton" style={styles.small_button} onClick={this.switchTexture}>Roughness</button>
            <button id="metalButton" style={styles.small_button} onClick={this.switchTexture}>Metal</button>
            <button id="normalButton" style={styles.small_button} onClick={this.switchTexture}>Normal</button>
          </div>
          <img id="texture" style={{maxHeight: '100%', maxWidth: '100%'}} src={focalTexture}
          alt={"No " + this.state.textureTypeFocal + " texture. Either upload or generate one"}/>
        </div>
      </div>
    );
  }
}
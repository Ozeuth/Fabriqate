import React from 'react';
import {styles, TextureType} from "./Render";

export default class Textures extends React.PureComponent {
  // --- UI CONTROL --- //
  constructor(props) {
    super(props);
    this.state = {
      texturePanelVisibility: 'hidden',
      textureTypeFocal: TextureType.COLOR,
      textureNew: null
    };
    this.toggleTextures = this.toggleTextures.bind(this);
    this.chooseTexture = this.chooseTexture.bind(this);
    this.newTexture = this.newTexture.bind(this);
    this.removeTexture = this.removeTexture.bind(this);
    this.switchTexture = this.switchTexture.bind(this);
  }

  toggleTextures() {
    const visibility = this.state.texturePanelVisibility === "hidden" ? "visible" : "hidden";
    this.setState({
      texturePanelVisibility: visibility
    })
  }

  chooseTexture(event) {
    this.setState({
      textureNew: event.target.files[0]
    })
  }

  newTexture() {
    if (this.state.textureNew !== null) {
      // TODO: Fragile dependence on meshName following `objectName_index` format
      let lastIndex = 0;
      for (let index = 0; index < this.props.materialPanelFocal.length; index++) {
        if (this.props.materialPanelFocal[index] === '_') { lastIndex = index }
      }
      // Fix dynamic variables for callback
      const meshName = this.props.materialPanelFocal;
      const objectName = this.props.materialPanelFocal.substring(0, lastIndex);
      const textureType = this.state.textureTypeFocal;
      const textureNew = this.state.textureNew;
      const textureIndex = this.props.materialPanelFocal.substring(lastIndex + 1);

      const formData = new FormData();
      formData.append('user', window.user);
      formData.append('projectName', window.project);
      formData.append('objectName', objectName);
      formData.append('textureType', textureType);
      formData.append('file', textureNew);
      formData.append('textureIndex', textureIndex);
      fetch('/newTexture', {
        method: 'post',
        body: formData
      }).then(res => {
        if (res.status === 200) {
          const texturePath = './uploads/' + textureNew.filename;
          window.textureFunc(window.scene, meshName, [texturePath], [textureType]);
          this.setState({
            textureNew: null
          });
        }
      });
    } else {
      window.alert("Please select a file to upload")
    }
  }

  removeTexture() {
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
        <button style={{...styles.default_button, ...{left: '5%', top: '6%'}}} onClick={this.toggleTextures}> Textures </button>
        <div id="texturesPanel" style={{...styles.panel, ...{left: '5%', top: 'calc(6% + 25px)', visibility: this.state.texturePanelVisibility}}}>
          <div id="textureButtons" style={{textAlign: 'center', display: 'inline-block'}}>
            <button id="colorButton" style={styles.small_button} onClick={this.switchTexture}>Color</button>
            <button id="aoButton" style={styles.small_button} onClick={this.switchTexture}>AO</button>
            <button id="roughButton" style={styles.small_button} onClick={this.switchTexture}>Roughness</button>
            <button id="metalButton" style={styles.small_button} onClick={this.switchTexture}>Metal</button>
            <button id="normalButton" style={styles.small_button} onClick={this.switchTexture}>Normal</button>
          </div>
          <img id="texture" style={{maxHeight: '100%', maxWidth: '100%'}} src={focalTexture}
          alt={"No " + this.state.textureTypeFocal + " texture. Either upload or generate one"}/>
          <div style={{textAlign: 'center', display: 'inline-block'}}>
            <input type="file" name="file" onChange={this.chooseTexture}/>
            <button id="textureAdd" style={styles.small_button} onClick={this.newTexture}>Add Texture</button>
            <button id="textureRemove" style={styles.small_button} onClick={this.removeTexture}>Remove</button>
          </div>
          <div id="slider_wrapper" style={{display: 'block'}}>
            <input id="slider" type="range" min={2} max={18} defaultValue={10}/>
            <label id="slider_label" htmlFor="slider">Brightness</label>
            <input id="slider" type="range" min={2} max={18} defaultValue={10}/>
            <label id="slider_label" htmlFor="slider">Contrast</label>
            <input id="slider" type="range" min={2} max={18} defaultValue={10}/>
            <label id="slider_label" htmlFor="slider">Saturation</label>
          </div>
          <button id="textureGenerate" style={styles.small_button}>Generate Remaining</button>
        </div>
      </div>
    );
  }
}
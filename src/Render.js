import React from 'react';
import {Engine, Scene, Texture} from 'react-babylonjs'
import * as BABYLON from 'babylonjs';
import * as LOAD from 'babylonjs-loaders';
import {ButtonColor} from "./Begin";
import Textures from './Textures';
import Ring_Color from './Render_Textures/ring_color.png'
import Ring_Ao from './Render_Textures/ring_ao.png'
import Ring_Metal from './Render_Textures/ring_metal.png'
import Ring_Rough from './Render_Textures/ring_rough.png'
import Ring_Normal from './Render_Textures/ring_normal.png'
const ring_color = 'Ring_color.png';
const ring_ao = 'Ring_ao.png';
const ring_rough = 'Ring_rough.png';
const ring_metal = 'Ring_metal.png';
const ring_normal = 'Ring_normal.png';

export const TextureType = {
  COLOR: 'color',
  AO: 'ao',
  ROUGH: 'rough',
  METAL: 'metal',
  NORMAL: 'normal'
};

export const styles = {
  root: {
    backgroundImage: 'url("./render_background.png")',
    position: 'absolute',
    width: "100%",
    height: "100%",
    padding: "0",
    margin: "0",
    backgroundSize: 'cover',
    backgroundRepeat: 'no-repeat',
    overflow: 'hidden',
  },
  panel: {
    width: '30%',
    position: 'absolute',
    display: 'inline-block',
    overflow: 'auto',
    backgroundColor: ButtonColor.INACTIVE,
  },
  default_button: {
    position: 'absolute',
    width: "100px",
    margin: "4px",
    borderRadius: "4px",
    border: "1px solid #D0D0D0",
    overflow: "auto",
    backgroundColor: ButtonColor.INACTIVE
  },
  small_button: {
    position: 'relative',
    borderRadius: "4px",
    border: "1px solid #D0D0D0",
    overflow: "auto",
    backgroundColor: ButtonColor.INACTIVE
  },
};

export default class Render extends React.Component {

  // --- UI CONTROL --- //
  constructor(props) {
    super(props);
    this.state = {
      objectPanelVisibility: "hidden",
      objectNew: null,
      objectPanelContent: window.objects ? Array.from(window.objects.keys()) : [],
      objectPanelFocal: null,
      materialPanelVisibility: "hidden",
      materialPanelContent: [],
      materialPanelFocal: null
    };
    this.toggleObjects = this.toggleObjects.bind(this);
    this.chooseObject = this.chooseObject.bind(this);
    this.newObject = this.newObject.bind(this);
    this.focusObject = this.focusObject.bind(this);
    this.removeObject = this.removeObject.bind(this);
    this.toggleMaterials = this.toggleMaterials.bind(this);
    this.focusMaterial = this.focusMaterial.bind(this);
  }

  toggleObjects() {
    const visibility = this.state.objectPanelVisibility === "hidden" ? "visible" : "hidden";
    const intendedFocal = this.state.objectPanelFocal ? this.state.objectPanelFocal : null;
    this.setState({
      objectPanelVisibility: visibility,
      objectPanelContent: Array.from(window.objects.keys()),
      objectPanelFocal: intendedFocal
    });
  }

  chooseObject(event) {
    this.setState({
      objectNew: event.target.files[0],
    })
  }

  newObject() {
    if (this.state.objectNew !== null) {
      const formData = new FormData();
      formData.append('user', window.user);
      formData.append('file', this.state.objectNew);
      formData.append('projectName', window.project);
      fetch('/newObject', {
        method: 'post',
        body: formData
      }).then(res => {
        if (res.status === 200) {
          res.text().then(text => {
            window.objFunc(window.scene, "./uploads/", text, false, this);
          });
        }
      });
    } else {
      window.alert("Please select a file to upload")
    }
  }

  focusObject(event) {
    this.setState({
      objectPanelFocal: event.target.id,
      materialPanelVisibility: "hidden",
      materialPanelFocal: window.objects.get(event.target.id).map(mesh => mesh.name)
    });
  }

  removeObject(event) {
    const objectName = event.target.id.replace("Remove", "");
    fetch('/removeObject', {
      method: 'delete',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        user: window.user,
        projectName: window.project,
        objectName: objectName
      })
    }).then(res => {
      if (res.status === 200) {
        if (this.state.objectPanelFocal === objectName) {
          this.setState({
            objectPanelFocal: null
          });
        }
        const meshes = window.objects.get(objectName);
        window.objects.delete(objectName);
        meshes.forEach(mesh => {
          mesh.dispose();
        });
        this.setState({
          objectPanelContent: Array.from(window.objects.keys())
        });
      }
    });
  }

  toggleMaterials() {
    const visibility = this.state.materialPanelVisibility === "hidden" ? "visible" : "hidden";
    const content = this.state.objectPanelFocal ? window.objects.get(this.state.objectPanelFocal).map(mesh => mesh.name) : [];
    this.setState({
      materialPanelVisibility: visibility,
      materialPanelContent: content
    });
  }

  focusMaterial(event) {
    this.setState({
      materialPanelFocal: event.target.id
    });
  }

  // --- RENDER CONTROL --- //
  make(e) {
    window.objFunc = function(scene, rendPath, rendName, setUp, render) {
      BABYLON.SceneLoader.LoadAssetContainer(rendPath, rendName, scene, function(container) {
        const newMeshes = container.meshes;
        for (let index = 0; index < newMeshes.length; index++) {
          const newMesh = newMeshes[index];
          newMesh.name = rendName + "_" + index;
          // Material Basic Setup
          const pbr = new BABYLON.PBRMaterial("pbr", scene);
          pbr.metallic = 1.0;
          pbr.roughness = 1.0;
          pbr.useRoughnessFromMetallicTextureAlpha = false;
          pbr.useRoughnessFromMetallicTextureGreen = false;
          pbr.useMetallnessFromMetallicTextureBlue = true;
          pbr.reflectionTexture = BABYLON.CubeTexture.CreateFromPrefilteredData("render.dds", scene);
          newMesh.material = pbr;
          let textureInfo ={
            color: null,
            ao: null,
            rough: null,
            metal: null,
            normal: null
          };
          window.textures = window.textures.set(newMesh, textureInfo);
          // Added Normal Data
          const positions = newMesh.getVerticesData(BABYLON.VertexBuffer.PositionKind);
          const indices = newMesh.getIndices();
          const normals = newMesh.getVerticesData(BABYLON.VertexBuffer.NormalKind);
          BABYLON.VertexData.ComputeNormals(positions, indices, normals);
          newMesh.updateVerticesData(BABYLON.VertexBuffer.NormalKind, normals, true, true);
        }
        window.objects = window.objects.set(rendName, newMeshes);
        container.addAllToScene();
        if (setUp) {
          scene.createDefaultCameraOrLight(true, true, true);
          scene.activeCamera.alpha += Math.PI;
        } else {
          render.setState({
            objectPanelContent: Array.from(window.objects.keys()),
            objectNew: null
          });
        }
      });
    };
    // TODO: Async error, Can be called before window.objFunc finishes!
    window.textureFunc = function(scene, meshName, texturePaths, textureTypes) {
      let mesh = null;
      const allMeshes = Array.from(window.textures.keys());
      allMeshes.forEach(found => {
        if (meshName === found.name) {mesh = found}
      });
      let counter = 0;
      const textureInfo = window.textures.get(mesh);
      texturePaths.forEach(texturePath => {
        switch (textureTypes[counter]) {
          case TextureType.COLOR:
            if (mesh.material.albedoTexture) {mesh.material.albedoTexture.dispose()}
            mesh.material.albedoTexture = new BABYLON.Texture(texturePath, scene);
            textureInfo.color = texturePath;
            break;
          case TextureType.AO:
            if (mesh.material.ambientTexture) {mesh.material.ambientTexture.dispose()}
            mesh.material.ambientTexture = new BABYLON.Texture(texturePath, scene);
            textureInfo.ao = texturePath;
            break;
          case TextureType.ROUGH:
            if (mesh.material.microSurfaceTexture) {mesh.material.microSurfaceTexture.dispose()}
            mesh.material.microSurfaceTexture = new BABYLON.Texture(texturePath, scene);
            textureInfo.rough = texturePath;
            break;
          case TextureType.METAL:
            if (mesh.material.metallicTexture) {mesh.material.metallicTexture.dispose()}
            mesh.material.metallicTexture = new BABYLON.Texture(texturePath, scene);
            textureInfo.metal = texturePath;
            break;
          case TextureType.NORMAL:
            if (mesh.material.bumpTexture) {mesh.material.bumpTexture.dispose()}
            mesh.material.bumpTexture = new BABYLON.Texture(texturePath, scene);
            textureInfo.normal = texturePath;
            break;
          default:
        }
        counter++;
      });
      window.textures = window.textures.set(meshName, textureInfo);
    };
    // Some clean up from prior
    delete window.tempHome;

    // Render Constructor
    const {canvas, scene} = e;
    const engine = new BABYLON.Engine(canvas, true);
    const Camera = new BABYLON.ArcRotateCamera("Camera", Math.PI / 2, Math.PI / 2, 2, BABYLON.Vector3.Zero(), scene);
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;

    // Scene setup
    const hdrTexture = BABYLON.CubeTexture.CreateFromPrefilteredData("render.dds", scene);
    scene.imageProcessingConfiguration.contrast = 1.3;
    scene.imageProcessingConfiguration.exposure = 1;
    scene.imageProcessingConfiguration.toneMappingEnabled = true;
    scene.environmentTexture = hdrTexture;
    scene.clearColor = new BABYLON.Color4(0, 0, 0, 0);

    // Obj loader setup
    LOAD.OBJFileLoader.OPTIMIZE_WITH_UV = true;  // Prevents UV Seam issues
    LOAD.OBJFileLoader.SKIP_MATERIALS = true;    // Ignores .mtl file data

    window.scene = scene;
    window.objects = new Map();
    window.textures = new Map();
    if (window.newProject) {
      // Upload Default New Object
      let formData = new FormData();
      formData.append('user', window.user);
      formData.append('file', null);
      formData.append('projectName', window.project);
      fetch('/newObject', {
        method: 'post',
        body: formData
      }).then(res => {
        if (res.status === 200) {
          // Render Default New Object
          window.objFunc(scene, "", "render.obj", true, null);
          // Upload Default New Textures
          formData = new FormData();
          formData.append('user', window.user);
          formData.append('projectName', window.project);
          formData.append('objectName', 'render.obj');
          const textureTypes = [TextureType.COLOR, TextureType.AO, TextureType.ROUGH, TextureType.METAL, TextureType.NORMAL];
          const texturePaths = [ring_color, ring_ao, ring_rough, ring_metal, ring_normal];
          let allTexturePromises = [];
          textureTypes.forEach(textureType => {
            formData.set('textureType', textureType);
            formData.set('file', null);
            formData.set('textureIndex', '0');
            let promise = fetch('/newTexture', {
              method: 'post',
              body: formData
            }).then();
            allTexturePromises.push(promise);
          });
          Promise.all(allTexturePromises).then(function () {
            // Render Default New Textures
            window.textureFunc(scene, "render.obj_0", texturePaths, textureTypes);
          });
        }
      });
    } else {
      // Download Project Objects
      fetch('/getObjects', {
        method:'post',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }, body: JSON.stringify({
            user: window.user,
            projectName: window.project
        })
      }).then(res => res.json()).then(foundObjects => {
        foundObjects.forEach(objectName => {
          let objectPath = "./uploads/";
          if (objectName === "render.obj") {
            objectPath = "";
          }
          // Render Project Objects
          window.objFunc(scene, objectPath, objectName, true, null);
          // Download Project Textures
          fetch('/getTextures', {
            method: 'post',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            }, body: JSON.stringify({
              user: window.user,
              projectName: window.project,
              objectName: objectName.toString(),
              meshIndex: "null"
            })
          }).then(res => res.json()).then(foundData => { // [[textureName, textureIndex, textureType],...]
            let maxIndex = 0;
            foundData.forEach(data => {
              const textureIndex = data[1];
              if (parseInt(textureIndex, 10) > maxIndex) {maxIndex = parseInt(textureIndex, 10)}
            });
            for (let index = 0; index < maxIndex + 1; index++) {
              let texturePaths = [];
              let textureTypes = [];
              foundData.forEach(data => {
                const textureIndex = data[1];
                if (parseInt(textureIndex, 10) === index) {
                  const textureName = data[0];
                  const textureType = data[2];
                  let texturePath = null;
                  if (textureName === ring_color || textureName === ring_ao || textureName === ring_rough
                    || textureName === ring_metal || textureName === ring_normal) {
                    switch (textureName) {
                      case ring_color:
                        texturePath = Ring_Color;
                        break;
                      case ring_ao:
                        texturePath = Ring_Ao;
                        break;
                      case ring_rough:
                        texturePath = Ring_Rough;
                        break;
                      case ring_metal:
                        texturePath = Ring_Metal;
                        break;
                      case ring_normal:
                        texturePath = Ring_Normal;
                        break;
                      default:
                    }
                  } else {
                    texturePath = './uploads' + textureName;
                  }
                  texturePaths.push(texturePath);
                  textureTypes.push(textureType);
                }
              });
              // Render Project Textures
              window.textureFunc(scene, objectName + "_" + index, texturePaths, textureTypes);
            }
          })
        });
      })
    }
    window.addEventListener("resize", function () {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    });
    scene.getEngine().runRenderLoop(() => {
      if (scene) {
        scene.render();
      }
    });
  }

  render() {
    return (
      <div style={styles.root}>
          <Engine canvasId="sample-canvas">
            <Scene onSceneMount={this.make}/>
          </Engine>
        <button id="objectToggleButton" style = {{...styles.default_button, ...{right: '10%', top: '6%'}}} onClick={this.toggleObjects}> Objects </button>
        <div id="objectsPanel" style = {{...styles.panel, ...{right: '10%', top: 'calc(6% + 25px)', visibility: this.state.objectPanelVisibility}}}>
          <input type="file" name="file" onChange={this.chooseObject}/>
          <button id="objectAddButton" style={{...styles.default_button, ...{right: '0%', top: '0%'}}} onClick={this.newObject}> Add Object </button>
          <div id = "object">
            <ul id = "objectList" style={{ listStyleType: "none", margin: '0'}}>
              {this.state.objectPanelContent.map(objectName =>
                  <li style={{display: 'inline-block', backgroundColor: (this.state.objectPanelFocal === objectName ? ButtonColor.ACTIVE : ButtonColor.INACTIVE )}}>
                    <span id={objectName} style={{fontSize: "100%", fontFamily: 'inherit'}} onClick={this.focusObject}>{objectName}</span>
                    <button id={objectName + "Materials"} style={{
                      ...styles.small_button,
                      ...{visibility: this.state.objectPanelVisibility === "visible" && this.state.objectPanelFocal === objectName ? "visible" : "hidden",
                          height: this.state.objectPanelFocal === objectName ?  '100%' : '0px',
                          width: this.state.objectPanelFocal === objectName ? '100px' : '0px',
                          margin: this.state.objectPanelFocal === objectName ? '4px' : '0px'}}} onClick={this.toggleMaterials}>Materials</button>
                    <button id={objectName + "Remove" } style={{
                      ...styles.small_button,
                      ...{visibility: this.state.objectPanelVisibility === "visible" && this.state.objectPanelFocal === objectName ? "visible" : "hidden",
                          height: this.state.objectPanelFocal === objectName ?  '100%' : '0px',
                          width: this.state.objectPanelFocal === objectName ? '100px' : '0px',
                          margin: this.state.objectPanelFocal === objectName ? '4px' : '0px'}}} onClick={this.removeObject}>Remove</button>
                    <ul id = {objectName + "materialList"} style = {{
                      listStyleType: "none",
                      margin: '0',
                      visibility: this.state.objectPanelVisibility === "visible" && this.state.objectPanelFocal === objectName && this.state.materialPanelVisibility === "visible" ? "visible" : "hidden",
                      height: this.state.objectPanelFocal === objectName && this.state.materialPanelVisibility === "visible" ? '100%' : '0px',
                      width: this.state.objectPanelFocal === objectName && this.state.materialPanelVisibility === "visible" ? '100%' : '0px',
                      overflow: "hidden",
                    }}>
                      {this.state.materialPanelContent.map(materialName =>
                        <li id = {materialName} style={{display: 'block', backgroundColor: (this.state.objectPanelFocal === objectName && this.state.materialPanelFocal === materialName ? ButtonColor.DOUBLE_ACTIVE : ButtonColor.ACTIVE)}} onClick={this.focusMaterial}>{materialName}</li>
                      )}
                    </ul>
                  </li>
              )}
            </ul>
          </div>
        </div>
        <button id="downloadButton" style={{...styles.default_button, ...{right: '10%', bottom: '6%'}}}> Download All </button>
        <Textures materialPanelFocal = {this.state.materialPanelFocal}/>
      </div>
    );
  }
}

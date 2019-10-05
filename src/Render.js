import React from 'react';
import {Engine, Scene} from 'react-babylonjs'
import * as BABYLON from 'babylonjs';
import * as LOAD from 'babylonjs-loaders';
import {ButtonColor} from "./Begin";
import Ring_Damaged_Gold from './Render_Textures/Ring_Damaged_Gold.png'
import Ring_Damaged_AO from './Render_Textures/Ring_Damaged_AO.png'
import Ring_Damaged_Metal from './Render_Textures/Ring_Damaged_Metal.png'
import Ring_Damaged_Rough from './Render_Textures/Ring_Damaged_Roughness.png'
import Ring_Damaged_Normal from './Render_Textures/Ring_Damaged_Normal.png'

let styles = {
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
            window.rendFunc(window.scene, "./uploads/", text, false, this);
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
    const objectName = event.target.id.replace(' Remove', '');
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
    window.rendFunc = function(rendScene, rendPath, rendName, setUp, render) {
      const pbr = new BABYLON.PBRMaterial("pbr", rendScene);
      pbr.metallic = 1.0;
      pbr.roughness = 1.0;
      pbr.useRoughnessFromMetallicTextureAlpha = false;
      pbr.useRoughnessFromMetallicTextureGreen = false;
      pbr.useMetallnessFromMetallicTextureBlue = true;
      pbr.reflectionTexture = BABYLON.CubeTexture.CreateFromPrefilteredData("render.dds", rendScene);

      pbr.albedoTexture = new BABYLON.Texture(Ring_Damaged_Gold, rendScene); // Color
      pbr.ambientTexture = new BABYLON.Texture(Ring_Damaged_AO, rendScene); // Shadow
      pbr.metallicTexture = new BABYLON.Texture(Ring_Damaged_Metal, rendScene); // Metal
      // Black = Organic, White = Metal
      pbr.microSurfaceTexture = new BABYLON.Texture(Ring_Damaged_Rough, rendScene); // Roughness
      // Black = Smooth, White = Rough
      pbr.bumpTexture = new BABYLON.Texture(Ring_Damaged_Normal, rendScene); // Normal

      BABYLON.SceneLoader.LoadAssetContainer(rendPath, rendName, rendScene, function(container) {
        const newMeshes = container.meshes;
        for (let index = 0; index < newMeshes.length; index++) {
          const newMesh = newMeshes[index];
          newMesh.name = rendName + "_" + index;
          newMesh.material = pbr;
          const positions = newMesh.getVerticesData(BABYLON.VertexBuffer.PositionKind);
          const indices = newMesh.getIndices();
          const normals = newMesh.getVerticesData(BABYLON.VertexBuffer.NormalKind);
          BABYLON.VertexData.ComputeNormals(positions, indices, normals);
          newMesh.updateVerticesData(BABYLON.VertexBuffer.NormalKind, normals, true, true);
        }
        window.objects = window.objects.set(rendName, newMeshes);
        if (setUp) {
          rendScene.createDefaultCameraOrLight(true, true, true);
          rendScene.activeCamera.alpha += Math.PI;
        } else {
          render.setState({
            objectPanelContent: Array.from(window.objects.keys()),
            objectNew: null
          });
        }
        container.addAllToScene();
      });
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

    window.objects = new Map();
    if (window.newProject) {
      // PBR new project setup
      const formData = new FormData();
      formData.append('user', window.user);
      formData.append('file', null);
      formData.append('projectName', window.project);
      fetch('/newObject', {
        method: 'post',
        body: formData
      }).then(res => {
        if (res.status === 200) {
          window.rendFunc(scene, "", "render.obj", true);
        }
      });
    } else {
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
          window.rendFunc(scene, objectPath, objectName, true);
        });
      })
    }
    window.scene = scene;
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
        <button id="object_toggle_button" style = {{...styles.default_button, ...{right: '10%', top: '6%'}}} onClick={this.toggleObjects}> Objects </button>
        <div id="objects_panel" style = {{
          right: '10%',
          top: 'calc(6% + 25px)',
          width: '30%',
          position: 'absolute',
          display: 'inline-block',
          overflow: 'auto',
          backgroundColor: ButtonColor.INACTIVE,
          visibility: this.state.objectPanelVisibility
        }}>
          <input type="file" name="file" onChange={this.chooseObject}/>
          <button id="object_add_button" style={{...styles.default_button, ...{right: '0%', top: '0%'}}} onClick={this.newObject}> Add Object </button>
          <div id = "object">
            <ul id = "objectList" style={{ listStyleType: "none", margin: '0'}}>
              {this.state.objectPanelContent.map(objectName =>
                  <li style={{display: 'inline-block', backgroundColor: (this.state.objectPanelFocal === objectName ? ButtonColor.ACTIVE : ButtonColor.INACTIVE )}}>
                    <span id={objectName} style={{fontSize: "100%", fontFamily: 'inherit'}} onClick={this.focusObject}>{objectName}</span>
                    <button id={objectName + " Materials"} style={{
                      ...styles.small_button,
                      ...{visibility: this.state.objectPanelVisibility === "visible" && this.state.objectPanelFocal === objectName ? "visible" : "hidden",
                          height: this.state.objectPanelFocal === objectName ?  '100%' : '0px',
                          width: this.state.objectPanelFocal === objectName ? '100px' : '0px',
                          margin: this.state.objectPanelFocal === objectName ? '4px' : '0px'}}} onClick={this.toggleMaterials}>Materials</button>
                    <button id={objectName + " Remove" } style={{
                      ...styles.small_button,
                      ...{visibility: this.state.objectPanelVisibility === "visible" && this.state.objectPanelFocal === objectName ? "visible" : "hidden",
                          height: this.state.objectPanelFocal === objectName ?  '100%' : '0px',
                          width: this.state.objectPanelFocal === objectName ? '100px' : '0px',
                          margin: this.state.objectPanelFocal === objectName ? '4px' : '0px'}}} onClick={this.removeObject}>Remove</button>
                    <ul id = {objectName + " materialList"} style = {{
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
        <button id="download_button" style={{...styles.default_button, ...{right: '10%', bottom: '6%'}}}> Download All </button>
      </div>
    );
  }
}

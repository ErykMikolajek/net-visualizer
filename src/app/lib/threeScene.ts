import * as THREE from "three";
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { displaySettings } from "../components/SideBar";

export function setupScene(container: HTMLDivElement | null) {
   if (!container) return null;

   const scene = new THREE.Scene();
   const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 5000);
   const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });

   renderer.setSize(window.innerWidth, window.innerHeight);
   renderer.setPixelRatio(window.devicePixelRatio);
   container.appendChild(renderer.domElement);
   container.style.position = "relative";

   const controls = new OrbitControls(camera, renderer.domElement);
   controls.enableDamping = true;
   controls.dampingFactor = 0.1;
   controls.screenSpacePanning = false;
   controls.minDistance = 100;
   controls.maxDistance = 1000;

   const labelRenderer = new CSS2DRenderer();
   labelRenderer.setSize(window.innerWidth, window.innerHeight);
   labelRenderer.domElement.style.position = "absolute";
   labelRenderer.domElement.style.top = "0";
   labelRenderer.domElement.style.left = "0";
   labelRenderer.domElement.style.width = "100%";
   labelRenderer.domElement.style.height = "100%";
   labelRenderer.domElement.style.pointerEvents = "none";
   container.appendChild(labelRenderer.domElement);

   return { scene, camera, renderer, labelRenderer, controls };
}


export function addInteractionToLayers(
   container: HTMLDivElement,
   camera: THREE.Camera,
   scene: THREE.Scene,
) {
   const raycaster = new THREE.Raycaster();
   const mouse = new THREE.Vector2();

   container.addEventListener("click", (event: MouseEvent) => {
      const boundingBox = container.getBoundingClientRect();
      mouse.x = ((event.clientX - boundingBox.left) / boundingBox.width) * 2 - 1;
      mouse.y = -((event.clientY - boundingBox.top) / boundingBox.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(scene.children, true);

      if (intersects.length > 0) {
         let mesh = intersects[0].object;
         
         if (mesh.userData?.name && mesh.userData?.toolTip) {
            let toolTip = mesh.userData.toolTip;
            toolTip.visible = !toolTip.visible;         }
      }
   });
 }

export function createModel(layers: any[], renderSettings: displaySettings) {
   const model = new THREE.Group();
   const maxObjectLength = 250;
   const spacingBetweenLayers = 20;
   let drawingPosition = 0;
   let arrowStart = new THREE.Vector3(0, 0, 0);
   let arrowEnd = new THREE.Vector3(0, 0, 0);

   const defualtColors = {
      'main_layer': new THREE.Color(0xF4A261),
      'main_edge': new THREE.Color(0xE76F51),
      'input_layer': new THREE.Color(0x2A9D8F),
      'input_edge': new THREE.Color(0x264653),
      'other_layer': new THREE.Color(0xE9C46A),
      'dense_layer': new THREE.Color(0x2A9D8F),
      'dense_edge': new THREE.Color(0x264653),
      'white': new THREE.Color(0xffffff)
   };

   const darkColors = {
      'main_layer': new THREE.Color(0x264653),
      'main_edge': new THREE.Color(0x2A9D8F),
      'input_layer': new THREE.Color(0xE9C46A),
      'input_edge': new THREE.Color(0xF4A261),
      'other_layer': new THREE.Color(0xE76F51),
      'dense_layer': new THREE.Color(0xE9C46A),
      'dense_edge': new THREE.Color(0xF4A261),
      'white': new THREE.Color(0xffffff)
   };

   const tailwindColors = {
      'main_layer': new THREE.Color(0x3B82F6),
      'main_edge': new THREE.Color(0x64748B),
      'input_layer': new THREE.Color(0xFACC15),
      'input_edge': new THREE.Color(0xEC4899),
      'other_layer': new THREE.Color(0x10B981),
      'dense_layer': new THREE.Color(0xFACC15),
      'dense_edge': new THREE.Color(0xEC4899),
      'white': new THREE.Color(0xffffff)
   };

   const neonColors = {
      'main_layer': new THREE.Color(0xFF00FF),
      'main_edge': new THREE.Color(0x00FFFF),
      'input_layer': new THREE.Color(0xFF4500),
      'input_edge': new THREE.Color(0x8B00FF),
      'other_layer': new THREE.Color(0x00FF00),
      'dense_layer': new THREE.Color(0xFF4500),
      'dense_edge': new THREE.Color(0x8B00FF),
      'white': new THREE.Color(0xffffff)
   };

   const naturalColors = {
      'main_layer': new THREE.Color(0x3E606F),
      'main_edge': new THREE.Color(0x6C4F3D),
      'input_layer': new THREE.Color(0xD9BF77),
      'input_edge': new THREE.Color(0xA67B5B),
      'other_layer': new THREE.Color(0xCFC291),
      'dense_layer': new THREE.Color(0xD9BF77),
      'dense_edge': new THREE.Color(0xA67B5B),
      'white': new THREE.Color(0xffffff)
   };

   const colorPalette = renderSettings.colorPalette;


   let colors = defualtColors;
   switch (colorPalette) {
      case 'default':
         colors = defualtColors;
         break;
      case 'dark':
         colors = darkColors;
         break;
      case 'tailwind':
         colors = tailwindColors;
         break;
      case 'neon':
         colors = neonColors;
         break;
      case 'natural':
         colors = naturalColors;
         break;
   }

   console.log(layers);

   layers.forEach((layer, layerIndex) => {
      const dimensions = layer.output_shape.match(/\d+/g)?.map(Number) ?? [];
      let [width, height, depth] = [
         Math.min(dimensions.at(-1) ?? 1, maxObjectLength),
         Math.min(dimensions.at(-2) ?? 1, maxObjectLength),
         Math.min(dimensions.at(-3) ?? 1, maxObjectLength),
      ];

      // Size labels
      const labelsDivs = Array.from({ length: 4 }, () => document.createElement("div"));
      labelsDivs.forEach(element => {
         element.className = "label";
         element.style.pointerEvents = "none";
         element.style.color = "white";
         element.style.fontSize = "9px";
         element.style.fontWeight = "bold";
         element.style.textShadow = "-1px -1px 0 black, 1px -1px 0 black, -1px 1px 0 black, 1px 1px 0 black";
      });
      const [xLabelDiv, yLabelDiv, zLabelDiv, layerNameLabelDiv] = labelsDivs;
      xLabelDiv.textContent = <string><any>width;
      yLabelDiv.textContent = <string><any>height;
      zLabelDiv.textContent = <string><any>depth;

      let sizexLabel = new CSS2DObject(xLabelDiv);
      let sizeyLabel = new CSS2DObject(yLabelDiv);
      let sizezLabel = new CSS2DObject(zLabelDiv);

      // Layer names labels
      layerNameLabelDiv.textContent = <string><any>layer.type;
      layerNameLabelDiv.style.fontSize = "12px";
      let layerNameLabel = new CSS2DObject(layerNameLabelDiv);

      let layerColor;
      let edgeColor;
      let customSpacing = 0;
      let drawSizeLabels = renderSettings.showLayerDimensions;
      let denseLayerLabels = false;
      let drawLayerNamesLabels = renderSettings.showLayerNames;

      switch (layer.type) {
         case 'InputLayer':
            layerColor = colors['input_layer'];
            edgeColor = colors['input_edge'];
            customSpacing = 1.5 * spacingBetweenLayers;
            drawLayerNamesLabels = false;
            break;
         case 'Conv2D':
            layerColor = colors['main_layer'];
            edgeColor = colors['main_edge'];
            break;
         case 'MaxPooling2D':
            layerColor = colors['other_layer'];
            edgeColor = colors['main_edge'];
            // customSpacing = -spacingBetweenLayers + 1;
            // drawLabels = false;
            break;
         case 'Dense':
            layerColor = colors['dense_layer'];
            edgeColor = colors['dense_edge'];
            width = [depth, depth = width][0]; // swaping width and height
            customSpacing = 1.5 * spacingBetweenLayers
            denseLayerLabels = true;
            sizexLabel = [sizezLabel, sizezLabel = sizexLabel][0];
            break;
         case 'ReLU':
            layerColor = colors['main_layer'];
            edgeColor = colors['main_edge'];
            break;
         case 'Flatten':
            return;
      }

      const geometry = new THREE.BoxGeometry(width, height, depth);
      const material = new THREE.MeshBasicMaterial({
         color: layerColor,
         opacity: 0.8,
      });
      const shape = new THREE.Mesh(geometry, material);
      shape.userData = {
         ...layer,
         layerIndex,
      };

      const toolTip = document.createElement("div");
      toolTip.className = "tooltip";
      toolTip.style.display = "block";
      toolTip.style.whiteSpace = "normal";
      toolTip.style.pointerEvents = "none";
      toolTip.style.color = "white";
      toolTip.style.fontSize = "12px";
      toolTip.style.fontWeight = "bold";
      const layerType = "Layer: " + layer.type;
      const shapeName = "Shape: " + layer.output_shape;
      
      const line1 = document.createElement("div");
      line1.textContent = layerType;
      toolTip.appendChild(line1);
      
      const line2 = document.createElement("div");
      line2.textContent = shapeName;
      toolTip.appendChild(line2);
      
      const blockHeight = 20 * 2; // 20px for each line, multiplied by 2 lines
      toolTip.style.height = `${blockHeight}px`;
      toolTip.style.minWidth = "100px";
      toolTip.style.maxWidth = "160px";
      toolTip.style.lineHeight = "1.5";
      
      toolTip.style.backgroundColor = "rgba(70, 0, 0, 0.9)";
      toolTip.style.borderRadius = "10px";
      toolTip.style.padding = "2px";
      toolTip.style.position = "absolute";

      toolTip.style.zIndex = "2000";
      toolTip.style.transform = "translate(-50%, -100%)";

      toolTip.style.transition = "opacity 0.3s ease-in-out";
      toolTip.style.opacity = "0.8";
      toolTip.style.textAlign = "center";

      const toolTipMesh = new CSS2DObject(toolTip);
      toolTipMesh.position.copy(shape.position);
      toolTipMesh.position.y += height / 2 + 5; // Adjust the position of the tooltip

      toolTipMesh.visible = false; // Hide the tooltip by default

      shape.add(toolTipMesh);
      shape.userData.toolTip = toolTipMesh;


      // Edges:
      const edgesGeometry = new THREE.EdgesGeometry(shape.geometry);
      const edgeMaterial = new THREE.LineBasicMaterial({
         color: edgeColor,
         linewidth: 2,
         depthTest: false,
         opacity: 0.8
      });
      const edgeLines = new THREE.LineSegments(edgesGeometry, edgeMaterial);
      shape.add(edgeLines);

      arrowStart.setX(drawingPosition);
      arrowEnd.setX(drawingPosition + spacingBetweenLayers + customSpacing);

      // Set layer name labels positions
      layerNameLabel.position.set(drawingPosition + (arrowStart.distanceTo(arrowEnd)) / 2, (height / 2) + 5, 0);

      drawingPosition += spacingBetweenLayers + customSpacing + (width / 2);
      shape.position.setX(drawingPosition);

      // Set dimensions labels positions
      sizexLabel.position.set(drawingPosition, -(height / 2) - 3.5, (depth / 2) + 3.5);
      sizeyLabel.position.set(drawingPosition + (width / 2) + 3.5, 0, (depth / 2) + 3.5);
      sizezLabel.position.set(drawingPosition + (width / 2), -(height / 2) - 3.5, 0);

      drawingPosition += (width / 2);

      // Arrows between layers
      if (layerIndex > 0) {
         const arrowDirection = new THREE.Vector3().subVectors(arrowEnd, arrowStart).normalize();
         const arrowLength = arrowStart.distanceTo(arrowEnd);
         const arrow = new THREE.ArrowHelper(arrowDirection, arrowStart, arrowLength, colors['input_edge'], 5, 5);
         model.add(arrow);
      }

      // Size labels
      if (drawSizeLabels) {
         model.add(sizezLabel);
         if (!denseLayerLabels) {
            model.add(sizexLabel);
            model.add(sizeyLabel);
         }
      }
      // Layer name labels
      if (drawLayerNamesLabels) {
         model.add(layerNameLabel);
      }

      model.add(shape);
   });

   const boundingBox = new THREE.Box3().setFromObject(model);
   const center = boundingBox.getCenter(new THREE.Vector3());
   model.position.sub(center);

   return model;
}

export function animateScene(renderer: THREE.WebGLRenderer, labelRenderer: CSS2DRenderer, scene: THREE.Scene, camera: THREE.PerspectiveCamera, controls: OrbitControls) {
   function animate() {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
      labelRenderer.render(scene, camera);
   }
   animate();
}

export function handleResize(camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer, labelRenderer: CSS2DRenderer) {
   const resize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      labelRenderer.setSize(window.innerWidth, window.innerHeight);
   };

   window.addEventListener("resize", resize);
   return () => window.removeEventListener("resize", resize);
}

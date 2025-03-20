import * as THREE from "three";
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

export function setupScene(container: HTMLDivElement | null) {
   if (!container) return null;

   const scene = new THREE.Scene();
   const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
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

export function createModel(layers: any[]) {
   const model = new THREE.Group();
   const layerCount = layers.length;
   const maxObjectLength = 250;
   const spacingBetweenLayers = 20;
   let drawingPosition = 0;
   let arrowStart = new THREE.Vector3(0, 0, 0);
   let arrowEnd = new THREE.Vector3(0, 0, 0);

   const colors = {'main_layer': new THREE.Color(0xF4A261),
                    'main_edge': new THREE.Color(0xE76F51),
                    'input_layer': new THREE.Color(0x2A9D8F),
                    'input_edge': new THREE.Color(0x264653),
                    'other_layer': new THREE.Color(0xE9C46A),
                    'dense_layer': new THREE.Color(0x2A9D8F),
                    'dense_edge': new THREE.Color(0x264653),
                    'white': new THREE.Color(0xffffff)
   };

   layers.forEach((layer, layerIndex) => {
      const dimensions = layer.output_shape.match(/\d+/g)?.map(Number) ?? [];
      let [width, height, depth] = [
         Math.min(dimensions.at(-1) ?? 1, maxObjectLength),
         Math.min(dimensions.at(-2) ?? 1, maxObjectLength),
         Math.min(dimensions.at(-3) ?? 1, maxObjectLength),
      ];

      // Size labels
      const labelsDivs = Array.from({length: 4}, () => document.createElement("div"));
      labelsDivs.forEach(element => {
         element.className = "label";
         element.style.pointerEvents = "none";
         element.style.color = "#264653";
         element.style.fontSize = "10px";
         element.style.fontWeight = "bold";
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
      let layerNameLabel = new CSS2DObject(layerNameLabelDiv);

      let layerColor;
      let edgeColor;
      let customSpacing = 0;
      let drawSizeLabels = true;
      let denseLayerLabels = false;
      let drawLayerNamesLabels = true;

      switch(layer.type){
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
        case 'Flatten':
            return;
      }

      const geometry = new THREE.BoxGeometry(width, height, depth);
      const material = new THREE.MeshBasicMaterial({
        color: layerColor,
        opacity: 0.8,
      });
      const shape = new THREE.Mesh(geometry, material);

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
      
      drawingPosition += (width/2);

      arrowStart.setX(drawingPosition);
      shape.position.setX(drawingPosition);

      // Set labels positions
      sizexLabel.position.set(drawingPosition, -(height/2) - 3.5, (depth/2) + 3.5);
      sizeyLabel.position.set(drawingPosition + (width/2) + 3.5,  0, (depth/2) + 3.5);
      sizezLabel.position.set(drawingPosition + (width/2), -(height/2) - 3.5, 0);
      layerNameLabel.position.set(drawingPosition - (width/2) - (spacingBetweenLayers)/2, (height/2) + 5, 0);

      drawingPosition += (width/2) + spacingBetweenLayers + customSpacing;

      arrowEnd.setX(drawingPosition);

      // Arrows between layers
      if (layerIndex + 1 < layerCount) {
         const arrowDirection = new THREE.Vector3().subVectors(arrowEnd, arrowStart).normalize();
         const arrowLength = arrowStart.distanceTo(arrowEnd);
         const arrow = new THREE.ArrowHelper(arrowDirection, arrowStart, arrowLength, colors['input_edge'], 5, 5);
         model.add(arrow);
      }

      // Size labels
      if (drawSizeLabels){
         model.add(sizezLabel);
         if (!denseLayerLabels){
            model.add(sizexLabel);
            model.add(sizeyLabel);
         }
      }
      // Layer name labels
      if (drawLayerNamesLabels){
         model.add(layerNameLabel);
      }

      model.add(shape)
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
// TODOD: add labelRenderer
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

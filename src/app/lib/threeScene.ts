import * as THREE from "three";
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export function setupScene(container: HTMLDivElement | null) {
   if (!container) return null;

   const scene = new THREE.Scene();
   const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
   const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });

   renderer.setSize(window.innerWidth, window.innerHeight);
   renderer.setPixelRatio(window.devicePixelRatio);
   container.appendChild(renderer.domElement);

   const controls = new OrbitControls(camera, renderer.domElement);
   controls.enableDamping = true;
   controls.dampingFactor = 0.1;
   controls.screenSpacePanning = false;
   controls.minDistance = 100;
   controls.maxDistance = 1000;

   return { scene, camera, renderer, controls };
}

export function createModel(layers: any[]) {
   const model = new THREE.Group();
   // const shapes: THREE.Mesh[] = [];
   const maxObjectLength = 250;
   const spacingBetweenLayers = 20;
   // const paddingAroundModel = 250;
   // let drawingPosition = -(window.innerWidth / 2) + paddingAroundModel;
   let drawingPosition = 0;
   const colors = {'main_layer': new THREE.Color(0xF4A261),
                    'main_edge': new THREE.Color(0xE76F51),
                    'input_layer': new THREE.Color(0x2A9D8F),
                    'input_edge': new THREE.Color(0x264653),
                    'other_layer': new THREE.Color(0xE9C46A),
                    'dense_layer': new THREE.Color(0x2A9D8F),
                    'dense_edge': new THREE.Color(0x264653),
                    'white': new THREE.Color(0xffffff)
   };

   layers.forEach(layer => {
      const dimensions = layer.output_shape.match(/\d+/g)?.map(Number) ?? [];
      let [width, height, depth] = [
         Math.min(dimensions.at(-1) ?? 1, maxObjectLength),
         Math.min(dimensions.at(-2) ?? 1, maxObjectLength),
         Math.min(dimensions.at(-3) ?? 1, maxObjectLength),
      ];

      let layerColor;
      let edgeColor;
      let customSpacing = 0;

      switch(layer.type){
        case 'InputLayer':
            layerColor = colors['input_layer'];
            edgeColor = colors['input_edge'];
            customSpacing = 1.5 * spacingBetweenLayers;
            break;
        case 'Conv2D':
            layerColor = colors['main_layer'];
            edgeColor = colors['main_edge'];
            break;
        case 'MaxPooling2D':
            layerColor = colors['other_layer'];
            edgeColor = colors['main_edge'];
            customSpacing = -spacingBetweenLayers + 3;
            break;
        case 'Dense':
            layerColor = colors['dense_layer'];
            edgeColor = colors['dense_edge'];
            width = [depth, depth = width][0]; // swaping width and height
            customSpacing = 1.5 * spacingBetweenLayers
            break;
        case 'Flatten':
            width = height = depth = 0;
            layerColor = edgeColor = colors['white'];
            break;
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
      shape.position.setX(drawingPosition);

      drawingPosition += (width/2) + spacingBetweenLayers + customSpacing;

      // shapes.push(shape);
      model.add(shape)
   });

   const boundingBox = new THREE.Box3().setFromObject(model);
   const center = boundingBox.getCenter(new THREE.Vector3());
   model.position.sub(center);

   return model;
}

export function animateScene(renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.PerspectiveCamera, controls: OrbitControls) {
   function animate() {
      requestAnimationFrame(animate);
    //   shapes.forEach(shape => shape.rotation.x += 0.002);
    controls.update();
      renderer.render(scene, camera);
   }
   animate();
}

export function handleResize(camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer) {
   const resize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
   };

   window.addEventListener("resize", resize);
   return () => window.removeEventListener("resize", resize);
}

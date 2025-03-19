import * as THREE from "three";
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export function setupScene(container: HTMLDivElement | null) {
   if (!container) return null;

   const scene = new THREE.Scene();
   const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
   const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });

   renderer.setSize(window.innerWidth, window.innerHeight);
   container.appendChild(renderer.domElement);

   const controls = new OrbitControls(camera, renderer.domElement);
   controls.enableDamping = true;
   controls.dampingFactor = 0.1;
   controls.screenSpacePanning = false;
   controls.minDistance = 100;
   controls.maxDistance = 1000;

   return { scene, camera, renderer, controls };
}

export function createShapes(layers: any[]) {
   const shapes: THREE.Mesh[] = [];
   const maxObjectLength = 250;
   const spacingBetweenLayers = 20;
   const paddingAroundModel = 250;
   let drawingPosition = -(window.innerWidth / 2) + paddingAroundModel;
   const colors = [];

   layers.forEach(layer => {
      const dimensions = layer.output_shape.match(/\d+/g)?.map(Number) ?? [];
      const [width, height, depth] = [
         Math.min(dimensions.at(-1) ?? 2, maxObjectLength),
         Math.min(dimensions.at(-2) ?? 2, maxObjectLength),
         Math.min(dimensions.at(-3) ?? 2, maxObjectLength),
      ];

      const geometry = new THREE.BoxGeometry(width, height, depth);
      const material = new THREE.MeshBasicMaterial({
         color: `#${Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, "0")}`,
      });
      const shape = new THREE.Mesh(geometry, material);
      
      // Edges:
      const edgesGeometry = new THREE.EdgesGeometry( shape.geometry );
      const edgeMaterial = new THREE.LineBasicMaterial( { color: 0x000000, linewidth: 2, depthTest: false } );
      const edgeLines = new THREE.LineSegments( edgesGeometry, edgeMaterial );
      shape.add(edgeLines);
      
      shape.position.set(drawingPosition, 0, 5);
      drawingPosition += width + spacingBetweenLayers;
      
      shapes.push(shape);
   });

   return shapes;
}

export function animateScene(renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.PerspectiveCamera, shapes: THREE.Mesh[], controls: OrbitControls) {
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

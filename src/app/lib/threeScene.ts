import * as THREE from "three";
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { displaySettings } from "../components/SideBar";
import { LayerActivation } from "../components/Visualizer";

// Set up the Three.js scene, camera, renderer, and controls
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

// Function to add an inference image to the scene, replacing layer 0
export function addInferenceImage(container: HTMLDivElement, camera: THREE.Camera, scene: THREE.Scene, inferenceFile: File) {
   const textureLoader = new THREE.TextureLoader();
   const imageUrl = URL.createObjectURL(inferenceFile);
   
   // First, remove any existing inference image from the scene
   const existingImages: THREE.Object3D[] = [];
   scene.traverse((obj) => {
      if (obj.userData.isInferenceImage) {
         existingImages.push(obj);
      }
   });
   existingImages.forEach((img) => {
      if (img.parent) {
         img.parent.remove(img);
      }
      if (img instanceof THREE.Mesh) {
         img.geometry.dispose();
         (img.material as THREE.Material).dispose();
      }
   });

   
   // Find layer 0 and replace it with the inference image
   scene.traverse((obj) => {
      if (obj.userData.layerIndex === 0 && obj instanceof THREE.Mesh && !obj.userData.isInferenceImage) {
         const layerMesh = obj as THREE.Mesh;
         const geometry = layerMesh.geometry as THREE.BoxGeometry;
         const params = geometry.parameters;
         
         // Get the layer dimensions (width, height, depth from BoxGeometry)
         const { height, depth } = params;
         
         // Hide the original layer box
         layerMesh.visible = false;
         
         // Load texture and create plane matching the layer's face
         const texture = textureLoader.load(imageUrl, () => {
            URL.revokeObjectURL(imageUrl);
         });
         texture.magFilter = THREE.NearestFilter;
         
         // Create plane geometry matching the layer's face (height x depth for YZ plane)
         const planeGeometry = new THREE.PlaneGeometry(height, depth);
         const planeMaterial = new THREE.MeshBasicMaterial({
            map: texture,
            side: THREE.DoubleSide,
            transparent: false,
         });
         
         const inferenceImage = new THREE.Mesh(planeGeometry, planeMaterial);
         inferenceImage.userData.isInferenceImage = true;
         
         // Rotate to face the X+ direction (same as network flow direction)
         inferenceImage.rotation.y = Math.PI / 2;
         
         // Position at the same location as the original layer
         inferenceImage.position.copy(layerMesh.position);
         
         // Add to the same parent as the layer (the model group)
         if (layerMesh.parent) {
            layerMesh.parent.add(inferenceImage);
         }
      }
   });
}

// Function to visualize inference output activations in the scene
export function visualizeInferenceOutput(scene: THREE.Scene, activations: LayerActivation[]) {
   // Remove any existing activation visualizations
   const existingActivations: THREE.Object3D[] = [];
   scene.traverse((obj) => {
      if (obj.userData.isActivationVisualization) {
         existingActivations.push(obj);
      }
   });
   existingActivations.forEach((activation) => {
      if (activation.parent) {
         activation.parent.remove(activation);
      }
      if (activation instanceof THREE.InstancedMesh) {
         activation.geometry.dispose();
         (activation.material as THREE.Material).dispose();
      }
   });

   // Find the model group in the scene
   let modelGroup: THREE.Group | null = null;
   scene.traverse((obj) => {
      if (obj instanceof THREE.Group && obj.children.some(child => child.userData.layerIndex !== undefined)) {
         modelGroup = obj;
      }
   });

   if (!modelGroup) {
      console.warn("Model group not found in scene");
      return;
   }

   // Store reference with explicit type to avoid TypeScript narrowing issues
   const group: THREE.Group = modelGroup as THREE.Group;

   // Collect all layer shapes first (direct children of modelGroup with layerIndex)
   // This avoids the issue of finding paddingBox which shares userData
   const layerShapes: THREE.Mesh[] = [];
   group.children.forEach((child: THREE.Object3D) => {
      if (child instanceof THREE.Mesh && child.userData.layerIndex !== undefined) {
         layerShapes.push(child);
      }
   });

   // Hide ALL children of the model group (original visualization)
   group.children.forEach((child: THREE.Object3D) => {
    if (!(child instanceof THREE.ArrowHelper) && (child.userData.isInferenceImage === undefined)) {
        child.visible = false;
        child.traverse((descendant: THREE.Object3D) => {
            if (!(descendant instanceof THREE.ArrowHelper) && (descendant.userData.isInferenceImage === undefined)) {
                descendant.visible = false;
            }
        });
      }
   });

   // Process each layer's activations
   activations.forEach((layerActivation) => {
      const { name, activations: values } = layerActivation;

      // Find the corresponding layer mesh from our collected shapes
      const layerMesh = layerShapes.find(shape => shape.userData.name === name);

      if (!layerMesh) {
         console.warn(`Layer mesh not found for: ${name}`);
         return;
      }

      // Skip input layers and flatten layers
      const layerType = layerMesh.userData.type;
      if (layerType === 'InputLayer' || layerType === 'Flatten') {
         return;
      }

      // Get the layer's geometry dimensions - these ARE the cube counts
      // In createModel, dimensions are extracted from output_shape as integers
      // layerWidth (X) = channels, layerHeight (Y) = spatial W, layerDepth (Z) = spatial H
      const geometry = layerMesh.geometry as THREE.BoxGeometry;
      const params = geometry.parameters;
      const layerWidth = Math.round(params.width);   // Number of cubes along X (channels)
      const layerHeight = Math.round(params.height); // Number of cubes along Y (spatial width)
      const layerDepth = Math.round(params.depth);   // Number of cubes along Z (spatial height)

      // Each cube is exactly 1x1x1
      const cubeSize = 1;
      
      // Total number of cubes in this layer
      const totalCubes = layerWidth * layerHeight * layerDepth;

      // Flatten activations for easier access
      const flattenArray = (arr: any): number[] => {
         if (!Array.isArray(arr)) return [arr];
         return arr.flatMap(flattenArray);
      };
      const flatActivations = flattenArray(values);

      // First pass: count non-zero activations for efficient rendering
      const threshold = 0.01; // Skip cubes with activation below this threshold
      let nonZeroCount = 0;
      const maxActivations = Math.min(flatActivations.length, totalCubes);
      for (let i = 0; i < maxActivations; i++) {
         if (flatActivations[i] > threshold) {
            nonZeroCount++;
         }
      }

      if (nonZeroCount === 0) {
         console.warn(`No non-zero activations for layer: ${name}`);
         return;
      }

      // Create instanced mesh only for non-zero activations - cubes are 1x1x1
      const cubeGeometry = new THREE.BoxGeometry(cubeSize * 0.95, cubeSize * 0.95, cubeSize * 0.95);
      
      // Custom shader material for per-instance opacity
      const cubeMaterial = new THREE.ShaderMaterial({
         transparent: true,
         depthWrite: false,
         uniforms: {},
         vertexShader: `
            attribute float instanceOpacity;
            varying float vOpacity;
            void main() {
               vOpacity = instanceOpacity;
               gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
            }
         `,
         fragmentShader: `
            varying float vOpacity;
            void main() {
               gl_FragColor = vec4(0.0, 0.0, 0.0, vOpacity);
            }
         `,
      });

      const instancedMesh = new THREE.InstancedMesh(cubeGeometry, cubeMaterial, nonZeroCount);
      instancedMesh.userData.isActivationVisualization = true;
      instancedMesh.userData.layerName = name;

      // Create opacity array for per-instance opacity (only for non-zero activations)
      const opacities = new Float32Array(nonZeroCount);

      // Position each cube and set its opacity
      const matrix = new THREE.Matrix4();
      const position = new THREE.Vector3();

      // Calculate starting positions (offset from center of the layer)
      // Each cube is 1x1x1, positioned at integer offsets
      const startX = -layerWidth / 2 + 0.5;
      const startY = -layerHeight / 2 + 0.5;
      const startZ = -layerDepth / 2 + 0.5;

      let flatIndex = 0;
      let instanceIndex = 0;

      // Iterate through all cube positions in the layer
      // Dense layers have different geometry (swapped width/depth in createModel) - handle separately
      const isDenseLayer = layerType === 'Dense';

      if (isDenseLayer) {
         // Dense layers: 1D activations displayed along Z axis (the column)
         // Geometry is BoxGeometry(1, 1, numNeurons) after the swap in createModel
         for (let i = 0; i < layerDepth; i++) {
            const activationValue = Math.max(0, Math.min(1, flatActivations[flatIndex] || 0));
            flatIndex++;

            if (activationValue <= threshold) {
               continue;
            }

            // Dense neurons are arranged along Z axis
            position.set(
               0,  // centered on X
               0,  // centered on Y
               startZ + i
            );

            matrix.setPosition(position);
            instancedMesh.setMatrixAt(instanceIndex, matrix);
            opacities[instanceIndex] = activationValue;
            instanceIndex++;
         }
      } else {
         // Conv2D, MaxPooling2D, etc.: 3D activations [H][W][C]
         // h = row index (0 = top row), w = column index, c = channel index
         for (let h = 0; h < layerDepth; h++) {
            for (let w = 0; w < layerHeight; w++) {
               for (let c = 0; c < layerWidth; c++) {
                  const activationValue = Math.max(0, Math.min(1, flatActivations[flatIndex] || 0));
                  flatIndex++;

                  // Skip cubes with near-zero activation
                  if (activationValue <= threshold) {
                     continue;
                  }

                  // Calculate position within the layer
                  // - Rows (h) map to Y axis, inverted (row 0 = top = high Y)
                  // - Columns (w) map to Z axis, flipped to match input image orientation
                  // - Channels (c) map to X axis (depth into the layer)
                  position.set(
                     startX + c,
                     startY + (layerHeight - 1 - h),  // Invert: row 0 at top (high Y)
                     startZ + (layerHeight - 1 - w)   // Flip: column 0 at high Z to match image
                  );

                  matrix.setPosition(position);
                  instancedMesh.setMatrixAt(instanceIndex, matrix);

                  // Opacity: activation value (0 = transparent, 1 = solid)
                  opacities[instanceIndex] = activationValue;

                  instanceIndex++;
               }
            }
         }
      }

      // Apply per-instance opacity attribute
      instancedMesh.instanceMatrix.needsUpdate = true;
      cubeGeometry.setAttribute('instanceOpacity', new THREE.InstancedBufferAttribute(opacities, 1));

      // Create black edge outline around the layer bounds
      const outlineGeometry = new THREE.BoxGeometry(layerWidth, layerHeight, layerDepth);
      const edgesGeometry = new THREE.EdgesGeometry(outlineGeometry);
      const edgeMaterial = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 2 });
      const layerOutline = new THREE.LineSegments(edgesGeometry, edgeMaterial);
      layerOutline.userData.isActivationVisualization = true;

      // Position the instanced mesh at the layer's position
      // Position both the instanced mesh and outline at the layer's position
      instancedMesh.position.copy(layerMesh.position);
      layerOutline.position.copy(layerMesh.position);

      // Add visualization to the model group
      if (modelGroup) {
         modelGroup.add(instancedMesh);
         modelGroup.add(layerOutline);
      }
   });
}

// Function to calculate and set the camera position to view the entire model
export function calculateCameraPosition(model: THREE.Object3D, camera: THREE.PerspectiveCamera) {
   const boundingBox = new THREE.Box3().setFromObject(model);
   const size = boundingBox.getSize(new THREE.Vector3());
   const center = boundingBox.getCenter(new THREE.Vector3());

   // Calculate the maximum dimension
   //const maxDim = Math.max(size.x, size.y, size.z);
   
   // Calculate the distance needed to view the entire model
   // Using a factor of 2 to ensure the model is fully visible with some padding
   const distance = size.x/2;

   // Position the camera
   camera.position.set(center.x, center.y + distance * 0.5, center.z + distance);
   camera.lookAt(center);

   // Update the controls target to the center of the model
   if (camera.userData.controls) {
      camera.userData.controls.target.copy(center);
      camera.userData.controls.update();
   }
}

// Helper function to animate controls target smoothly
function animateControlsTarget(controls: OrbitControls, targetPosition: THREE.Vector3, duration: number = 400) {
   const startTarget = controls.target.clone();
   const startTime = performance.now();
   
   function animate() {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease out cubic for smooth deceleration
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      
      controls.target.lerpVectors(startTarget, targetPosition, easeProgress);
      controls.update();
      
      if (progress < 1) {
         requestAnimationFrame(animate);
      }
   }
   
   animate();
}

// Function to reset focus to model center
export function resetFocusToModelCenter(model: THREE.Object3D, controls: OrbitControls) {
   const boundingBox = new THREE.Box3().setFromObject(model);
   const center = boundingBox.getCenter(new THREE.Vector3());
   animateControlsTarget(controls, center);
}

// Function to add interaction (hover tooltips and click to focus) to layers
export function addInteractionToLayers(
   container: HTMLDivElement,
   camera: THREE.Camera,
   scene: THREE.Scene,
   controls: OrbitControls,
   onLayerFocus?: (layerName: string | null) => void
) {
   const raycaster = new THREE.Raycaster();
   const mouse = new THREE.Vector2();
   let currentIntersected: THREE.Object3D | null = null;

   function onMouseMove(event: MouseEvent) {
      const boundingBox = container.getBoundingClientRect();
      mouse.x = ((event.clientX - boundingBox.left) / boundingBox.width) * 2 - 1;
      mouse.y = -((event.clientY - boundingBox.top) / boundingBox.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(scene.children, true);

      if (intersects.length > 0) {
         const mesh = intersects[0].object;
         
         if (mesh !== currentIntersected) {
            if (currentIntersected && currentIntersected.userData?.toolTip) {
               currentIntersected.userData.toolTip.visible = false;
            }
            
            if (mesh.userData?.toolTip) {
               mesh.userData.toolTip.visible = true;
               currentIntersected = mesh;
            }
         }
      } else {
         if (currentIntersected && currentIntersected.userData?.toolTip) {
            currentIntersected.userData.toolTip.visible = false;
            currentIntersected = null;
         }
      }
   }

   function onClick(event: MouseEvent) {
      const boundingBox = container.getBoundingClientRect();
      mouse.x = ((event.clientX - boundingBox.left) / boundingBox.width) * 2 - 1;
      mouse.y = -((event.clientY - boundingBox.top) / boundingBox.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(scene.children, true);

      if (intersects.length > 0) {
         let targetMesh = intersects[0].object;
         
         // Find the actual layer mesh (check if clicked on padding box or other child)
         if (targetMesh.parent && targetMesh.parent.userData?.layerIndex !== undefined) {
            targetMesh = targetMesh.parent;
         }
         
         // Only focus on actual layer meshes
         if (targetMesh.userData?.layerIndex !== undefined) {
            // Get the world position of the layer center
            const worldPosition = new THREE.Vector3();
            targetMesh.getWorldPosition(worldPosition);
            
            // Animate the controls target to this layer's center
            animateControlsTarget(controls, worldPosition);
            
            // Notify about the focus change
            if (onLayerFocus) {
               onLayerFocus(targetMesh.userData.name || `Layer ${targetMesh.userData.layerIndex}`);
            }
         }
      }
   }

   container.addEventListener("mousemove", onMouseMove);
   container.addEventListener("click", onClick);
   
   // Return cleanup function
   return () => {
      container.removeEventListener("mousemove", onMouseMove);
      container.removeEventListener("click", onClick);
   };
}

// Function to create the 3D model from layers
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

//    console.log(layers);

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
         element.style.padding = "2px";
         element.style.textShadow = "-0.5px -0.5px 0.5px black, 0.5px -0.5px 0.5px black, -0.5px 0.5px 0.5px black, 0.5px 0.5px 0.5px black";
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
         case 'Dropout':
            return; // Skip dropout layers in visualization
         case 'BatchNormalization':
            return; // Skip batch normalization layers in visualization
         case 'GlobalAveragePooling2D':
            layerColor = colors['other_layer'];
            edgeColor = colors['main_edge'];
            // customSpacing = 1.5 * spacingBetweenLayers;
            // drawLayerNamesLabels = false;
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

      // Add invisible padding box for better hover detection
      const padding = 10; // Padding size in pixels
      const paddingGeometry = new THREE.BoxGeometry(
         width + padding,
         height + padding,
         depth + padding
      );
      const paddingMaterial = new THREE.MeshBasicMaterial({
         visible: false,
         transparent: true,
         opacity: 0
      });
      const paddingBox = new THREE.Mesh(paddingGeometry, paddingMaterial);
      paddingBox.userData = shape.userData; // Share the same userData
      shape.add(paddingBox);

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

      toolTipMesh.renderOrder = Infinity;
      toolTipMesh.visible = false;

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

// Animation loop
export function animateScene(renderer: THREE.WebGLRenderer, labelRenderer: CSS2DRenderer, scene: THREE.Scene, camera: THREE.PerspectiveCamera, controls: OrbitControls) {
   function animate() {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
      labelRenderer.render(scene, camera);
   }
   animate();
}

// Handle window resize
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

import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import * as THREE from "three";

const getModelTensorflowEndpoint = "http://localhost:4000/tensorflow"
const uploadModelEndpoint = "http://localhost:4000/upload"

export async function fetchNetworkData(file: File) {
    const formData = new FormData();
    formData.append("file", file);
   
    if (file.name.endsWith(".h5")) {
      try {
         const response = await fetch(getModelTensorflowEndpoint, {
            method: "POST",
            body: formData,
         });
   
         if (!response.ok) throw new Error("Failed to fetch network data");
   
         return await response.json();
      } catch (error) {
         console.error("Error fetching network data:", error);
         throw error;
      }
   }
   else if (file.name.endsWith(".pt")) {
      try {
         const response = await fetch("http://localhost:4000/pytorch", {
            method: "POST",
            body: formData,
         });
   
         if (!response.ok) throw new Error("Failed to fetch network data");
   
         return await response.json();
      } catch (error) {
         console.error("Error fetching network data:", error);
         throw error;
      }
   }
}
 
 export async function exportSceneToGLB(scene: THREE.Scene): Promise<Response> {
   return new Promise((resolve, reject) => {
       const exporter = new GLTFExporter();

       const exportOptions = {
           trs: false,
           onlyVisible: true,
           binary: true, // This ensures GLB (binary) format
           maxTextureSize: 4096 // Optional: limit texture size
       };

       exporter.parse(
           scene, 
           (gltfContent) => {
               if (!(gltfContent instanceof ArrayBuffer)) {
                   reject(new Error('Export failed: Invalid GLB format'));
                   return;
               }
               const formData = new FormData();
               formData.append('scene', new Blob([gltfContent], { type: 'model/gltf-binary' }), 'scene.glb');

               fetch(uploadModelEndpoint, {
                   method: 'POST',
                   body: formData
               })
               .then(response => {
                   if (!response.ok) {
                       throw new Error(`HTTP error! status: ${response.status}`);
                   }
                   resolve(response);
               })
               .catch(error => {
                   reject(error);
               });
           },
           (error) => {
               reject(new Error(`GLB export error: ${error}`));
           },
           exportOptions
       );
   });
}
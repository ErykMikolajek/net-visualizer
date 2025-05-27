import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import * as THREE from "three";

const getModelTensorflowEndpoint = "http://localhost:4000/tensorflow"
const getModelPytorchEndpoint = "http://localhost:4000/pytorch"
const uploadModelEndpoint = "http://localhost:4000/upload"
const downloadLatestEndpoint = "http://localhost:4000/download-latest"

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
         const response = await fetch(getModelPytorchEndpoint, {
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
               
               // Create a unique filename using timestamp
               const timestamp = new Date().getTime();
               const filename = `model_${timestamp}.glb`;
               
               const formData = new FormData();
               formData.append('file', new Blob([gltfContent], { type: 'model/gltf-binary' }), filename);

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
                   console.error('Error uploading GLB:', error);
                   reject(error);
               });
           },
           (error) => {
               console.error('GLB export error:', error);
               reject(new Error(`GLB export error: ${error}`));
           },
           exportOptions
       );
   });
}

export async function downloadLatestGLB(): Promise<void> {
    try {
        const response = await fetch(downloadLatestEndpoint);
        
        if (!response.ok) {
            throw new Error('Failed to download GLB file');
        }
        
        // Get the filename from the Content-Disposition header or use a default name
        const contentDisposition = response.headers.get('Content-Disposition');
        let filename = 'model.glb';
        if (contentDisposition) {
            const filenameMatch = contentDisposition.match(/filename="(.+)"/);
            if (filenameMatch) {
                filename = filenameMatch[1];
            }
        }
        
        // Create a blob from the response
        const blob = await response.blob();
        
        // Create a download link and trigger the download
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        
        // Cleanup
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    } catch (error) {
        console.error('Error downloading GLB file:', error);
        throw error;
    }
}
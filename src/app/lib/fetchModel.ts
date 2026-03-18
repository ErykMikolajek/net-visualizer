import { LayerActivation } from "../components/Visualizer";
import { ImageInputSettings } from "../components/SideBar";

const getModelTensorflowEndpoint = "http://localhost:4000/tensorflow"
const getModelPytorchEndpoint = "http://localhost:4000/pytorch"
const runInferenceEndpoint = "http://localhost:4000/inference"

interface InferenceResponse {
    [layerName: string]: number[][];
}

// Fetch network data based on the file type
export async function fetchNetworkData(file: File, imageSettings?: ImageInputSettings) {
    const formData = new FormData();
    formData.append("file", file);
    
    // Add image settings to form data if provided
    if (imageSettings) {
        formData.append("img_width", imageSettings.width.toString());
        formData.append("img_height", imageSettings.height.toString());
        formData.append("img_channels", imageSettings.channels.toString());
    }
   
    if (file.name.endsWith(".h5") || file.name.endsWith(".keras")) {
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

// Run inference on the model with the provided image and return layer activations
export async function runInference(file: File, model_name: string, imageSettings: ImageInputSettings): Promise<LayerActivation[]> {
    if (!file) throw new Error("No file provided");
    const formData = new FormData();
    formData.append("file", file);
    formData.append("model_name", model_name);
    formData.append("img_width", imageSettings.width.toString());
    formData.append("img_height", imageSettings.height.toString());
    formData.append("img_channels", imageSettings.channels.toString());
    try {
        const response = await fetch(runInferenceEndpoint, {
            method: "POST",
            body: formData,
        });
        if (!response.ok) throw new Error("Failed to run inference");
        const data: InferenceResponse = await response.json();
        
        const layerActivations: LayerActivation[] = Object.entries(data).map(
            ([name, activations]): LayerActivation => ({
                name,
                activations,
            })
        );
        
        return layerActivations;
    } catch (error) {
        console.error("Error running inference:", error);
        throw error;
    }
}
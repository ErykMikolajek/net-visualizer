import { LayerActivation } from "../components/Visualizer";

const getModelTensorflowEndpoint = "http://localhost:4000/tensorflow"
const getModelPytorchEndpoint = "http://localhost:4000/pytorch"
const runInferenceEndpoint = "http://localhost:4000/inference"

interface InferenceResponse {
    [layerName: string]: number[][];
}

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

export async function runInference(file: File, modelName: string): Promise<LayerActivation[]> {
    if (!file) throw new Error("No file provided");
    const formData = new FormData();
    formData.append("file", file);
    formData.append("modelName", modelName);
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
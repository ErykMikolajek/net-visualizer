import { useState, useEffect, useRef } from "react";

interface Layer {
   name: string;
   type: string;
   output_shape: string;
}

interface LoadedModel {
   model_name: string;
   total_params: number;
   layers: Array<Layer>;
}

export default function Visualizer({ data }: { data: File }) {
   const [modelData, setModelData] = useState<LoadedModel | null>(null);
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState<string | null>(null);
   const visualizerRef = useRef<HTMLDivElement>(null);

   useEffect(() => {
      const fetchNetworkData = async () => {
         setLoading(true);
         setError(null);
         try {
            const formData = new FormData();
            formData.append("file", data);

            // TODO: make endpoint call dependent on selected framework
            const response = await fetch("http://localhost:4000/tensorflow", {
               method: "POST",
               body: formData,
            });
            if (!response.ok) {
               throw new Error("Failed to fetch network data");
            }
            const result = await response.json();
            setModelData(result);
         } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred");
            console.error("Error fetching network data:", err);
         } finally {
            setLoading(false);
         }
      };

      if (data) {
         fetchNetworkData();
         visualizerRef.current?.scrollIntoView({ behavior: "smooth" });
      }
   }, [data]);

   useEffect(() => {
      console.log("Updated model data:", modelData);
      console.log("model name:", modelData?.model_name);
   }, [modelData]);

   return (
      <div
         ref={visualizerRef}
         className="w-full flex flex-col items-center min-h-screen"
      >
         <h2 className="text-2xl font-semibold text-zinc-900 mt-6 mb-8">
            Your neural net:
         </h2>
         <div className="flex-1 w-full flex items-center justify-center">
            <div className="w-96 h-96 bg-gray-100 rounded-lg flex items-center justify-center">
               {loading && <p className="text-gray-400">Loading...</p>}
               {error && <p className="text-red-500">{error}</p>}
               {!loading && !error && modelData && (
                  <pre className="text-gray-600 p-4 overflow-auto">
                     {modelData.model_name}
                     <ul>
                        {modelData.layers.map((layer) => (
                           <li>
                              Name: {layer.name}, output shape:{" "}
                              {layer.output_shape}
                           </li>
                        ))}
                     </ul>
                  </pre>
               )}
               {!loading && !error && !modelData && (
                  <p className="text-gray-400">TEST</p>
               )}
            </div>
         </div>
      </div>
   );
}

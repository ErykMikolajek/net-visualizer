import { useState, useEffect, useRef } from "react";

export default function Visualizer({ data }: { data: File }) {
   const [networkData, setNetworkData] = useState<File | null>(null);
   const visualizerRef = useRef<HTMLDivElement>(null);

   useEffect(() => {
      setNetworkData(data);
      // Scroll to the visualizer when it mounts
      visualizerRef.current?.scrollIntoView({ behavior: "smooth" });
   }, [data]);

   return (
      <div
         ref={visualizerRef}
         className="w-full flex flex-col items-center min-h-screen"
      >
         <h2 className="text-2xl font-semibold text-gray-700 mt-6 mb-8">
            Your neural net:
         </h2>
         <div className="flex-1 w-full flex items-center justify-center">
            <div className="w-96 h-96 bg-gray-100 rounded-lg flex items-center justify-center">
               <p className="text-gray-400">Mock Network Visualization</p>
            </div>
         </div>
      </div>
   );
}

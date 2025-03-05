"use client";

import { useState } from "react";
import FileLoading from "./components/FileLoading";
import Visualizer from "./components/Visualizer";

export default function Home() {
   const [networkData, setNetworkData] = useState<File | null>(null);

   return (
      <main className="h-screen bg-white">
         <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl font-bold text-gray-800 pt-20 mb-12">
               Network Visualizer
            </h1>
         </div>
         <FileLoading onDataLoaded={setNetworkData} />
         {networkData && <Visualizer data={networkData} />}
      </main>
   );
}

"use client";

import { useState } from "react";
import FileLoading from "./components/FileLoading";
import Visualizer from "./components/Visualizer";
import WebGLBackground from "./components/WebGLBackground";

export default function Home() {
   const [networkData, setNetworkData] = useState<File | null>(null);

   return (
      <main className="h-screen">
         <WebGLBackground />
         <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl font-bold text-zinc-900 pt-20 mb-12">
               Network Visualizer
            </h1>
         </div>
         <FileLoading onDataLoaded={setNetworkData} />
         {networkData && <Visualizer data={networkData} />}
      </main>
   );
}

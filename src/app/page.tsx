"use client";

import { useState } from "react";
import FileLoading from "./components/FileLoading";
import Visualizer from "./components/Visualizer";
import MovingBackground from "./components/MovingBackground";

export default function Home() {
   const [networkData, setNetworkData] = useState<File | null>(null);

   // TODO: add blur behind text (when nothing is behind it - it is invisible, when some object is behind the blur becomes visible naturally)
   return (
      <main className="h-screen w-full">
         <MovingBackground />
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

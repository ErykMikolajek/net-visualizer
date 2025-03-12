"use client";

import Image from "next/image";
import { useState } from "react";

interface FileLoadingProps {
   onDataLoaded: (file: File) => void;
}

export default function FileLoading({ onDataLoaded }: FileLoadingProps) {
   const [framework, setFramework] = useState<string>("tensorflow");
   const [selectedFile, setSelectedFile] = useState<File | null>(null);

   const supportedFrameworks: Record<string, string[]> = {
      pytorch: [".pth", ".pt"],
      tensorflow: [".pb", ".h5"],
      other: [".json"],
   };

   const handleFileChange = async (
      event: React.ChangeEvent<HTMLInputElement>
   ) => {
      const file = event.target.files?.[0];
      if (!file) return;

      setSelectedFile(file);
      onDataLoaded(file);
   };

   return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] w-full max-w-2xl mx-auto px-4 mb-30">
         <div className="w-full mb-12">
            <p className="text-zinc-900 mb-3 text-center font-medium">
               Choose the model framework:
            </p>
            <select
               className="w-full max-w-md mx-auto block p-3 text-zinc-900 bg-zinc-50 border border-zinc-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent transition-all"
               value={framework}
               onChange={(e) => setFramework(e.target.value)}
            >
               <option value="tensorflow">Tensorflow</option>
               <option value="pytorch">Pytorch</option>
               <option value="other">Other</option>
            </select>
         </div>

         {/* File Upload Section */}
         <p className="text-zinc-900 mb-4 text-center font-medium">
            Upload your model file below:
         </p>
         <div className="bg-zinc-50 p-8 rounded-xl border border-zinc-300 shadow-sm hover:shadow-md transition-all w-full max-w-md mx-auto">
            <div className="flex flex-col items-center">
               <label
                  htmlFor="file-upload"
                  className="cursor-pointer bg-zinc-900 text-zinc-50 px-8 py-3 rounded-xl hover:bg-gray-800 transition-all font-medium shadow-sm hover:shadow-md"
               >
                  Choose File
               </label>
               <input
                  id="file-upload"
                  type="file"
                  className="hidden"
                  accept={supportedFrameworks[framework].join(",")}
                  onChange={handleFileChange}
               />
               <p className="mt-4 text-sm text-zinc-900 text-center">
                  {selectedFile
                     ? `Selected: ${selectedFile.name}`
                     : "Drag and drop your file here, or click to select"}
               </p>
               <p className="text-xs text-zinc-700 mt-2 text-center">
                  Supported formats: {supportedFrameworks[framework].join(", ")}
               </p>
            </div>
         </div>
      </div>
   );
}

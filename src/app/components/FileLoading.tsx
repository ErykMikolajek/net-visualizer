"use client";

import Image from "next/image";
import { useState } from "react";

interface FileLoadingProps {
   onDataLoaded: (file: File) => void;
}

export default function FileLoading({ onDataLoaded }: FileLoadingProps) {
   const [framework, setFramework] = useState<string>("pytorch");
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
      <div className="flex flex-col items-center justify-center w-full pb-30">
         <div className="mb-12">
            <p className="text-gray-600 mb-3">Choose the model framework:</p>
            <select
               className="w-64 p-3 text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
               value={framework}
               onChange={(e) => setFramework(e.target.value)}
            >
               <option value="pytorch">Pytorch</option>
               <option value="tensorflow">Tensorflow</option>
               <option value="other">Other</option>
            </select>
         </div>

         {/* File Upload Section */}
         <p className="text-gray-600 mb-3">Upload your model file below:</p>
         <div className="bg-gray-50 p-8 rounded-xl border-2 border-dashed border-gray-300 hover:border-blue-500 transition-colors">
            <div className="flex flex-col items-center">
               <Image
                  src="/file.svg"
                  alt="Upload file"
                  width={48}
                  height={48}
                  className="mb-4"
               />
               <label
                  htmlFor="file-upload"
                  className="cursor-pointer bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
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
               <p className="mt-2 text-sm text-gray-500">
                  {selectedFile
                     ? `Selected: ${selectedFile.name}`
                     : "Drag and drop your file here, or click to select"}
               </p>
               <p className="text-xs text-gray-400 mt-1">
                  Supported formats: {supportedFrameworks[framework].join(", ")}
               </p>
            </div>
         </div>
      </div>
   );
}

import React, { useState } from "react";
import { Menu, X } from "lucide-react";

export default function SideBar() {
   const [isSidebarOpen, setIsSidebarOpen] = useState(false);

   const toggleSidebar = () => {
      setIsSidebarOpen(!isSidebarOpen);
   };

   return (
      <div className="relative">
         <button
            onClick={toggleSidebar}
            className="fixed top-4 right-4 z-50 flex items-center justify-center w-12 h-12 cursor-pointer bg-zinc-900 text-zinc-50 rounded-xl hover:bg-zinc-800 transition-colors duration-200 focus:outline-none"
            aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
         >
            {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
         </button>

         {/* Sidebar */}
         <div
            className={`fixed top-0 right-0 z-40 w-64 h-full bg-zinc-50 border border-zinc-300 shadow-sm transform transition-transform duration-300 ease-in-out ${
               isSidebarOpen ? "translate-x-0" : "translate-x-full"
            }`}
         >
            <div className="p-6">
               <h2 className="text-xl font-semibold text-zinc-900 mb-6">
                  Display options
               </h2>
               <div className="space-y-4">
                  <div className="flex items-center">
                     <input
                        type="checkbox"
                        // id={optionKey}
                        // checked={options[optionKey]}
                        // onChange={() => handleOptionChange(optionKey)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                     />
                     <label
                        // htmlFor={optionKey}
                        className="ml-2 block text-sm text-gray-700"
                     >
                        Option1
                     </label>
                  </div>
               </div>
            </div>
         </div>
      </div>
   );
}

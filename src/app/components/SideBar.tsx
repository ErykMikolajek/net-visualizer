import { Menu, Reply } from "lucide-react";

export interface displaySettings {
   showLayerNames: boolean;
   showLayerDimensions: boolean;
   colorPalette: number;
}

export default function SideBar({
   isOpen,
   setIsOpen,
   settings,
   setSettings,
}: {
   isOpen: boolean;
   setIsOpen: (open: boolean) => void;
   settings: displaySettings;
   setSettings: (settings: displaySettings) => void;
}) {
   const toggleSidebar = () => {
      setIsOpen(!isOpen);
   };

   return (
      <div className="relative">
         <button
            onClick={toggleSidebar}
            className="absolute top-4 left-4 z-50 flex items-center justify-center w-12 h-12 cursor-pointer bg-zinc-900 text-zinc-50 rounded-xl hover:bg-zinc-800 transition-colors duration-200 focus:outline-none"
            aria-label={isOpen ? "Close sidebar" : "Open sidebar"}
         >
            {isOpen ? <Reply size={24} /> : <Menu size={24} />}
         </button>

         {/* Sidebar */}
         <div
            className={`fixed top-0 left-0 z-40 w-64 h-full bg-zinc-50 border border-zinc-300 shadow-sm transform transition-transform duration-300 ease-in-out ${
               isOpen ? "translate-x-0" : "-translate-x-full"
            }`}
         >
            <div className="p-6 mt-15 h-full flex flex-col items-left justify-start">
               <h2 className="text-xl font-semibold text-zinc-900 mb-6">
                  Display options
               </h2>
               <div className="flex flex-col items-left">
                  <h3 className="pb-1 text-md font-semibold text-zinc-900">
                     Labels visibility
                  </h3>
                  <div className="flex flex-row items-center py-1">
                     <input
                        type="checkbox"
                        id="showLayerDimensions"
                        checked={settings.showLayerDimensions}
                        onChange={() =>
                           setSettings({
                              ...settings,
                              showLayerDimensions:
                                 !settings.showLayerDimensions,
                           })
                        }
                        className="h-4 w-4 text-zinc-600 focus:ring-zinc-500 border-zinc-300 rounded accent-zinc-700"
                     />
                     <label
                        htmlFor="showLayerDimensions"
                        className="ml-2 block text-sm text-zinc-700"
                     >
                        Show tensor sizes
                     </label>
                  </div>
                  <div className="flex flex-row items-center">
                     <input
                        type="checkbox"
                        id="showLayerNames"
                        checked={settings.showLayerNames}
                        onChange={() =>
                           setSettings({
                              ...settings,
                              showLayerNames: !settings.showLayerNames,
                           })
                        }
                        className="h-4 w-4 text-zinc-600 focus:ring-zinc-500 border-zinc-300 rounded accent-zinc-700"
                     />
                     <label
                        htmlFor="showLayerNames"
                        className="ml-2 block text-sm text-zinc-700"
                     >
                        Show layers names
                     </label>
                  </div>
               </div>
            </div>
         </div>
      </div>
   );
}

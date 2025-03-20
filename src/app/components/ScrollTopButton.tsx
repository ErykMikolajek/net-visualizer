import { ArrowUp } from "lucide-react";

export default function ScrollTopButton() {
   const scrollToTop = () => {
      window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
   };

   return (
      <div className="relative">
         <button
            onClick={scrollToTop}
            className="fixed bottom-4 right-4 z-50 flex items-center justify-center w-12 h-12 cursor-pointer bg-zinc-900 text-zinc-50 rounded-xl hover:bg-zinc-800 transition-colors duration-200 focus:outline-none"
         >
            <ArrowUp size={24} />
         </button>
      </div>
   );
}

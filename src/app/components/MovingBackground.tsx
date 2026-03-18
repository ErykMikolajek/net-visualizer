import { useState, useEffect, useRef } from "react";
import * as THREE from "three";

export default function MovingBackground() {
   const containerRef = useRef<HTMLDivElement>(null);
   const [blur, setBlur] = useState(0);
   const [opacity, setOpacity] = useState(1);

   // Scroll handling
   useEffect(() => {
      const handleScroll = () => {
         const scrollY = window.scrollY;
         const maxBlur = 50;
         const blurAmount = Math.min(scrollY / 50, maxBlur);

         const fadeStart = window.innerHeight;
         const opacityValue = Math.max(1 - (scrollY - fadeStart), 0);

         setBlur(blurAmount);
         setOpacity(opacityValue);
      };

      window.addEventListener("scroll", handleScroll);
      return () => window.removeEventListener("scroll", handleScroll);
   }, []);

   return (
      <div
         ref={containerRef}
         className="fixed top-0 left-0 w-full h-full -z-10 bg-white"
      ></div>
   );
}

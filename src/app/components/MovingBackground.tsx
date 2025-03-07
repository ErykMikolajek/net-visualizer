"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

export default function MovingBackground() {
   const containerRef = useRef<HTMLDivElement>(null);
   const [blur, setBlur] = useState(0);
   const [opacity, setOpacity] = useState(1);
   const scrolling = useRef(false);
   const lastScrollPosition = useRef(0);

   // TODO: fix scrolling!
   useEffect(() => {
      // Smooth scroll handler using requestAnimationFrame
      const updateScroll = () => {
         const scrollPosition = window.scrollY;
         lastScrollPosition.current = scrollPosition;

         // First blur (0 to 5px over first 300px of scroll)
         const newBlur = Math.min(5, scrollPosition / 60);
         setBlur(newBlur);

         // Then fade to white (after 400px of scroll, complete by 600px)
         if (scrollPosition > 400) {
            const fadeAmount = Math.max(0, 1 - (scrollPosition - 400) / 200);
            setOpacity(fadeAmount);
         } else {
            setOpacity(1);
         }

         if (scrolling.current) {
            requestAnimationFrame(updateScroll);
         }
      };

      // Handle scroll events
      const handleScrollStart = () => {
         if (!scrolling.current) {
            scrolling.current = true;
            requestAnimationFrame(updateScroll);
         }
      };

      const handleScrollEnd = () => {
         scrolling.current = false;
      };

      // Add both scroll and wheel event listeners for better coverage
      window.addEventListener("scroll", handleScrollStart, { passive: true });
      window.addEventListener("wheel", handleScrollStart, { passive: true });
      window.addEventListener("touchmove", handleScrollStart, {
         passive: true,
      });

      // Use a debounced scroll end detection
      let scrollEndTimer: NodeJS.Timeout;
      const handleScroll = () => {
         clearTimeout(scrollEndTimer);
         scrollEndTimer = setTimeout(handleScrollEnd, 100);
      };
      window.addEventListener("scroll", handleScroll, { passive: true });

      if (!containerRef.current) return;

      // Setup scene
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(
         75,
         window.innerWidth / window.innerHeight,
         0.1,
         1000
      );
      const renderer = new THREE.WebGLRenderer({ alpha: true });
      renderer.setSize(window.innerWidth, window.innerHeight);
      containerRef.current.appendChild(renderer.domElement);

      // Create some geometric shapes
      // TODO: add one type of shape
      const shapes: THREE.Mesh[] = [];
      const geometries = [
         new THREE.BoxGeometry(1, 1, 1),
         //  new THREE.BoxGeometry(2, 2, 2),
         //  new THREE.BoxGeometry(1, 3, 1),
         //  new THREE.BoxGeometry(1, 3, 2),
         //  new THREE.BoxGeometry(1, 3, 3),
         new THREE.SphereGeometry(0.7, 32, 32),
         new THREE.TetrahedronGeometry(0.8),
      ];

      // Create multiple shapes with random positions
      for (let i = 0; i < 10; i++) {
         const geometry =
            geometries[Math.floor(Math.random() * geometries.length)];
         const material = new THREE.MeshBasicMaterial({
            color: 0x808080,
            // TODO: remove wireframe, change material, add shadows
            wireframe: true,
         });
         const shape = new THREE.Mesh(geometry, material);

         // Random position
         // TODO: find proper positions boundaries
         shape.position.set(
            (Math.random() - 0.5) * 20,
            (Math.random() - 0.5) * 12,
            -5 + (Math.random() - 0.5) * 5
         );

         shapes.push(shape);
         scene.add(shape);
      }

      camera.position.z = 5;

      // Animation function
      // TODO: Each shape rotates in different direction
      function animate() {
         requestAnimationFrame(animate);

         shapes.forEach((shape) => {
            shape.rotation.x += 0.002;
            shape.rotation.y += 0.003;
         });

         renderer.render(scene, camera);
      }

      // Handle window resize
      const handleResize = () => {
         camera.aspect = window.innerWidth / window.innerHeight;
         camera.updateProjectionMatrix();
         renderer.setSize(window.innerWidth, window.innerHeight);
      };

      window.addEventListener("resize", handleResize);
      animate();

      // Cleanup
      return () => {
         window.removeEventListener("scroll", handleScrollStart);
         window.removeEventListener("wheel", handleScrollStart);
         window.removeEventListener("touchmove", handleScrollStart);
         window.removeEventListener("scroll", handleScroll);
         scrolling.current = false;
         clearTimeout(scrollEndTimer);
         window.removeEventListener("resize", handleResize);
         containerRef.current?.removeChild(renderer.domElement);
         geometries.forEach((geometry) => geometry.dispose());
         shapes.forEach((shape) => {
            shape.geometry.dispose();
            (shape.material as THREE.Material).dispose();
         });
      };
   }, []);

   return (
      <>
         <div className="fixed top-0 left-0 w-full h-full -z-20 bg-white" />
         <div
            ref={containerRef}
            className="fixed top-0 left-0 w-full h-full -z-10 transition-[filter,opacity] duration-100"
            style={{
               filter: `blur(${blur}px)`,
               opacity,
            }}
         />
      </>
   );
}

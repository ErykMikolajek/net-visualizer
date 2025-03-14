// "use client";
import { useState, useEffect, useRef } from "react";
import * as THREE from "three";

export default function MovingBackground() {
   const containerRef = useRef<HTMLDivElement>(null);
   const [blur, setBlur] = useState(0);
   const [opacity, setOpacity] = useState(1);

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

   useEffect(() => {
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
      const shapes: THREE.Mesh[] = [];
      const geometries = [
         new THREE.BoxGeometry(1, 1, 1),
         new THREE.SphereGeometry(0.7, 32, 32),
         new THREE.TetrahedronGeometry(0.8),
      ];

      // Create multiple shapes with random positions
      for (let i = 0; i < 10; i++) {
         const geometry =
            geometries[Math.floor(Math.random() * geometries.length)];
         const material = new THREE.MeshBasicMaterial({
            color: 0x808080,
            wireframe: true,
         });
         const shape = new THREE.Mesh(geometry, material);

         // Random position
         shape.position.set(
            (Math.random() - 0.5) * 10,
            (Math.random() - 0.5) * 10,
            -5 + (Math.random() - 0.5) * 5
         );

         shapes.push(shape);
         scene.add(shape);
      }

      camera.position.z = 5;

      // Animation function
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
      <div
         ref={containerRef}
         className="fixed top-0 left-0 w-full h-full -z-10"
         style={{
            filter: `blur(${blur}px)`,
            opacity: opacity,
            transition: "opacity",
         }}
      ></div>
   );
}

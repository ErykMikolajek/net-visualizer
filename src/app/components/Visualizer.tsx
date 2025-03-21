import { useState, useEffect, useRef } from "react";
import { CSS2DObject } from "three/addons/renderers/CSS2DRenderer.js";
import * as THREE from "three";
import {
   setupScene,
   createModel,
   animateScene,
   handleResize,
} from "../lib/threeScene";
import { fetchNetworkData } from "../lib/fetchModel";
import SideBar, { displaySettings } from "./SideBar";
import ScrollTopButton from "./ScrollTopButton";

interface Layer {
   name: string;
   type: string;
   output_shape: string;
}

interface LoadedModel {
   model_name: string;
   total_params: number;
   layers: Layer[];
}

export default function Visualizer({ data }: { data: File }) {
   const containerRef = useRef<HTMLDivElement>(null);
   const modelRef = useRef<THREE.Object3D | null>(null);
   const visualizerRef = useRef<HTMLDivElement>(null);
   const [lastScrollY, setLastScrollY] = useState(0);
   const [lastTime, setLastTime] = useState(0);
   const [shouldScroll, setShouldScroll] = useState(false);
   const [scrollVelocity, setScrollVelocity] = useState(0);
   const [modelData, setModelData] = useState<LoadedModel | null>(null);
   const [isSidebarOpen, setIsSidebarOpen] = useState(false);
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState<string | null>(null);

   const [settingsState, setSettingsState] = useState<displaySettings>({
      showLayerNames: true,
      showLayerDimensions: true,
      colorPalette: 0,
   });

   useEffect(() => {
      if (!data) return;

      setLoading(true);
      setError(null);

      fetchNetworkData(data)
         .then(setModelData)
         .catch((err) => setError(err.message))
         .finally(() => setLoading(false));

      visualizerRef.current?.scrollIntoView({ behavior: "smooth" });
   }, [data]);

   useEffect(() => {
      const handleScroll = () => {
         const now = performance.now();
         const scrollY = window.scrollY;
         const deltaY = scrollY - lastScrollY;
         const deltaTime = now - lastTime;

         if (deltaTime > 0) {
            const velocity = deltaY / deltaTime; // px per ms
            setScrollVelocity(velocity);
         }

         const isScrollingDown = deltaY > 0;
         setLastScrollY(scrollY);
         setLastTime(now);

         if (isScrollingDown && scrollY >= window.innerHeight / 2) {
            setShouldScroll(true);
         }
      };

      window.addEventListener("scroll", handleScroll);
      return () => window.removeEventListener("scroll", handleScroll);
   }, [lastScrollY, lastTime]);

   useEffect(() => {
      if (shouldScroll && visualizerRef.current) {
         const targetPosition = visualizerRef.current.offsetTop;
         const startPosition = window.scrollY;
         const distance = targetPosition - startPosition;

         // bazowy czas animacji, ale im większa prędkość, tym krócej
         const baseDuration = 800;
         const speedFactor = Math.max(
            0.3,
            Math.min(1, Math.abs(scrollVelocity) / 0.5)
         ); // normalizacja
         const duration = baseDuration * speedFactor; // dynamiczna długość animacji

         let startTime: number | null = null;

         function animateScroll(currentTime: number) {
            if (startTime === null) startTime = currentTime;
            const timeElapsed = currentTime - startTime;
            const progress = Math.min(timeElapsed / duration, 1);
            window.scrollTo(
               0,
               startPosition + distance * easeOutCubic(progress)
            );

            if (timeElapsed < duration) {
               requestAnimationFrame(animateScroll);
            } else {
               setShouldScroll(false);
            }
         }

         function easeOutCubic(t: number) {
            return 1 - Math.pow(1 - t, 3);
         }

         requestAnimationFrame(animateScroll);
      }
   }, [shouldScroll]);

   useEffect(() => {
      if (!containerRef.current || !modelData) return;

      const sceneSetup = setupScene(containerRef.current);
      if (!sceneSetup) return;
      const scene = sceneSetup.scene;
      const camera = sceneSetup.camera;
      const renderer = sceneSetup.renderer;
      const labelRenderer = sceneSetup.labelRenderer;
      const controls = sceneSetup.controls;

      if (!scene || !camera || !renderer) return;

      if (modelRef.current) {
         controls.saveState();

         scene.remove(modelRef.current);
         modelRef.current.children.forEach((child) => {
            if (child instanceof THREE.Mesh) {
               child.geometry.dispose();
               (child.material as THREE.Material).dispose();
            }
         });
         modelRef.current.clear();
      }
      modelRef.current = createModel(modelData.layers, settingsState);
      controls.reset();
      scene.add(modelRef.current);

      camera.position.z = 400;
      camera.position.y = 100;
      renderer.render(scene, camera);

      animateScene(renderer, labelRenderer, scene, camera, controls);
      const cleanupResize = handleResize(camera, renderer, labelRenderer);

      return () => {
         cleanupResize();
         containerRef.current?.removeChild(renderer.domElement);
         if (modelRef.current) {
            scene.remove(modelRef.current);
            modelRef.current?.children.forEach((child) => {
               const mesh = child as THREE.Mesh;
               if (mesh.geometry) mesh.geometry.dispose();
               if (mesh.material) (mesh.material as THREE.Material).dispose();
            });
            modelRef.current?.children.forEach((child) => {
               if (child instanceof THREE.Object3D) {
                  child.children.forEach((labelChild) => {
                     if (labelChild instanceof CSS2DObject) {
                        labelRenderer.domElement.removeChild(
                           labelChild.element
                        );
                     }
                  });
               }
            });
            modelRef.current.clear();
         }
      };
   }, [modelData, settingsState]);

   // function updateModel(model: THREE.Object3D, settings: displaySettings) {
   //    model.children.forEach((child) => {
   //       if (child instanceof THREE.Mesh) {
   //          // np. zmiana koloru warstw w zależności od settingsState.colorPalette
   //          const material = child.material as THREE.MeshBasicMaterial;
   //          material.color.set(new THREE.Color(0xffffff));
   //       }
   //    });
   // }

   return (
      <div ref={visualizerRef} className="relative w-full min-h-screen flex">
         <h2
            className={`absolute top-2 left-15 text-2xl font-semibold text-zinc-900 p-4 z-50 transform transition-transform duration-300 ease-in-out
               ${isSidebarOpen ? "translate-x-50" : "translate-x-0"}`}
         >
            {modelData && <div>{data.name}</div>}
         </h2>
         <SideBar
            isOpen={isSidebarOpen}
            setIsOpen={setIsSidebarOpen}
            settings={settingsState}
            setSettings={setSettingsState}
         />
         <div
            ref={containerRef}
            className="flex-1 flex items-center justify-center"
         >
            {loading && <p className="text-zinc-900">Loading...</p>}
            {error && <p className="text-red-500">{error}</p>}
            {!loading && !error && modelData && <div></div>}
         </div>
         <ScrollTopButton setSideBar={setIsSidebarOpen} />
      </div>
   );
}
// TODO: sad face when can't parse object

import { useState, useEffect, useRef } from "react";
import { CSS2DObject } from "three/addons/renderers/CSS2DRenderer.js";
import * as THREE from "three";
import {
   setupScene,
   createModel,
   animateScene,
   handleResize,
} from "../lib/threeScene";
import { exportSceneToGLB, fetchNetworkData } from "../lib/fetchModel";
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
   const sceneRef = useRef<any>(null);
   const visualizerRef = useRef<HTMLDivElement>(null);
   const [modelData, setModelData] = useState<LoadedModel | null>(null);
   const [isSidebarOpen, setIsSidebarOpen] = useState(false);
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState<string | null>(null);

   const [settingsState, setSettingsState] = useState<displaySettings>({
      showLayerNames: true,
      showLayerDimensions: true,
      colorPalette: "default",
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
      if (!containerRef.current || !modelData) return;

      const sceneSetup = setupScene(containerRef.current);
      if (!sceneSetup) return;

      sceneRef.current = sceneSetup;
      const { scene, camera, renderer, labelRenderer, controls } = sceneSetup;

      modelRef.current = createModel(modelData.layers, settingsState);
      scene.add(modelRef.current);

      camera.position.z = 400;
      camera.position.y = 100;
      // renderer.render(scene, camera);

      animateScene(renderer, labelRenderer, scene, camera, controls);
      const cleanupResize = handleResize(camera, renderer, labelRenderer);

      return () => {
         cleanupResize();
         if (
            containerRef.current &&
            renderer.domElement.parentNode === containerRef.current
         ) {
            containerRef.current.removeChild(renderer.domElement);
         }
         if (
            containerRef.current &&
            labelRenderer.domElement.parentNode === containerRef.current
         ) {
            containerRef.current.removeChild(labelRenderer.domElement);
         }
         if (modelRef.current) {
            scene.remove(modelRef.current);
            modelRef.current.children.forEach((child) => {
               const mesh = child as THREE.Mesh;
               if (mesh.geometry) mesh.geometry.dispose();
               if (mesh.material) (mesh.material as THREE.Material).dispose();
            });
            modelRef.current.children.forEach((child) => {
               if (child instanceof THREE.Object3D) {
                  child.children.forEach((labelChild) => {
                     if (labelChild instanceof CSS2DObject) {
                        if (labelChild.element.parentNode) {
                           labelChild.element.parentNode.removeChild(
                              labelChild.element
                           );
                        }
                     }
                  });
               }
            });
            modelRef.current.clear();
         }
         exportSceneToGLB(scene);
      };
   }, [modelData]);

   // Handle settings changes without recreating the model
   useEffect(() => {
      if (!modelRef.current || !modelData || !sceneRef.current) return;

      const { scene, camera, renderer, labelRenderer } = sceneRef.current;

      scene.remove(modelRef.current);

      modelRef.current.children.forEach((child) => {
         if (child instanceof THREE.Mesh) {
            child.geometry.dispose();
            (child.material as THREE.Material).dispose();
         }
      });
      modelRef.current.clear();

      modelRef.current = createModel(modelData.layers, settingsState);

      scene.add(modelRef.current);

      renderer.render(scene, camera);
      labelRenderer.render(scene, camera);
   }, [settingsState]);

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

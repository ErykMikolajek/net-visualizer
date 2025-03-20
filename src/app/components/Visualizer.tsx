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
   const visualizerRef = useRef<HTMLDivElement>(null);
   const [modelData, setModelData] = useState<LoadedModel | null>(null);
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState<string | null>(null);

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
      const scene = sceneSetup.scene;
      const camera = sceneSetup.camera;
      const renderer = sceneSetup.renderer;
      const labelRenderer = sceneSetup.labelRenderer;
      const controls = sceneSetup.controls;

      if (!scene || !camera || !renderer) return;

      const model = createModel(modelData.layers);
      scene.add(model);

      camera.position.z = 400;
      camera.position.y = 100;
      renderer.render(scene, camera);

      animateScene(renderer, labelRenderer, scene, camera, controls);
      const cleanupResize = handleResize(camera, renderer, labelRenderer);

      return () => {
         cleanupResize();
         containerRef.current?.removeChild(renderer.domElement);
         if (model) {
            scene.remove(model);
            model.children.forEach((child) => {
               const mesh = child as THREE.Mesh;
               if (mesh.geometry) mesh.geometry.dispose();
               if (mesh.material) (mesh.material as THREE.Material).dispose();
            });
            model.children.forEach((child) => {
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
            model.clear();
         }
      };
   }, [modelData]);

   return (
      <div
         ref={visualizerRef}
         className="w-full flex flex-col items-center min-h-screen"
      >
         <h2 className="text-2xl font-semibold text-zinc-900 mt-6 mb-8">
            Your neural net:
         </h2>
         <div className="flex-1 w-full flex items-center justify-center">
            {loading && <p className="text-gray-400">Loading...</p>}
            {error && <p className="text-red-500">{error}</p>}
            {!loading && !error && modelData && <div ref={containerRef}></div>}
         </div>
      </div>
   );
}

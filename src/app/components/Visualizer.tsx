import { useState, useEffect, useRef } from "react";
import * as THREE from "three";

interface Layer {
   name: string;
   type: string;
   output_shape: string;
}

interface LoadedModel {
   model_name: string;
   total_params: number;
   layers: Array<Layer>;
}

export default function Visualizer({ data }: { data: File }) {
   const containerRef = useRef<HTMLDivElement>(null);
   const [modelData, setModelData] = useState<LoadedModel | null>(null);
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState<string | null>(null);
   const visualizerRef = useRef<HTMLDivElement>(null);

   useEffect(() => {
      const fetchNetworkData = async () => {
         setLoading(true);
         setError(null);
         try {
            const formData = new FormData();
            formData.append("file", data);

            // TODO: make endpoint call dependent on selected framework
            const response = await fetch("http://localhost:4000/tensorflow", {
               method: "POST",
               body: formData,
            });
            if (!response.ok) {
               throw new Error("Failed to fetch network data");
            }
            const result = await response.json();
            setModelData(result);
         } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred");
            console.error("Error fetching network data:", err);
         } finally {
            setLoading(false);
         }
      };

      if (data) {
         fetchNetworkData();
         visualizerRef.current?.scrollIntoView({ behavior: "smooth" });
      }
   }, [data]);

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

      const maxSize = 250;
      const geometries =
         modelData?.layers.map((layer) => {
            const shapes = layer.output_shape.match(/\d+/g)?.map(Number) ?? [];
            const [width, height, depth] = [
               Math.min(shapes.at(-3) ?? 1, maxSize),
               Math.min(shapes.at(-2) ?? 1, maxSize),
               Math.min(shapes.at(-1) ?? 1, maxSize),
            ];
            return new THREE.BoxGeometry(width, height, depth);
         }) ?? [];

      // TODO: save geometries as an dictionary (just use model data and parse inside function below?) to render differently depending on layer type (other rotation for dense layer
      geometries.map((form, index) => {
         const randomColor = () =>
            `#${Math.floor(Math.random() * 0xffffff)
               .toString(16)
               .padStart(6, "0")}`;
         const material = new THREE.MeshBasicMaterial({
            // color: 0x808080,
            color: randomColor(),
         });
         const shape = new THREE.Mesh(form, material);

         shape.position.set(index * 20, 0, 5);
         shape.rotateY(45);

         shapes.push(shape);
         scene.add(shape);
      });

      camera.position.z = 500;
      renderer.render(scene, camera);

      // // Animation function
      // function animate() {
      //    requestAnimationFrame(animate);

      //    shapes.forEach((shape) => {
      //       shape.rotation.x += 0.002;
      //       shape.rotation.y += 0.003;
      //    });

      //    renderer.render(scene, camera);
      // }

      // Handle window resize
      const handleResize = () => {
         camera.aspect = window.innerWidth / window.innerHeight;
         camera.updateProjectionMatrix();
         renderer.setSize(window.innerWidth, window.innerHeight);
      };

      window.addEventListener("resize", handleResize);
      // animate();

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
   }, [modelData]);

   // {!loading && !error && modelData && (
   //    <pre className="text-gray-600 p-4 overflow-auto">
   //       {modelData.model_name}
   //       <ul>
   //          {modelData.layers.map((layer) => (
   //             <li key={layer.name}>
   //                Name: {layer.name}, output shape:
   //                {layer.output_shape}
   //             </li>
   //          ))}
   //       </ul>
   //    </pre>
   // )}
   // {!loading && !error && !modelData && (
   //    <p className="text-gray-400">TEST</p>
   // )}

   return (
      <div
         ref={visualizerRef}
         className="w-full flex flex-col items-center min-h-screen"
      >
         <h2 className="text-2xl font-semibold text-zinc-900 mt-6 mb-8">
            Your neural net:
         </h2>
         <div className="flex-1 w-full flex items-center justify-center">
            <div className="w-96 h-96 bg-gray-100 rounded-lg flex items-center justify-center">
               {loading && <p className="text-gray-400">Loading...</p>}
               {error && <p className="text-red-500">{error}</p>}
               {!loading && !error && modelData && (
                  <div ref={containerRef}></div>
               )}
            </div>
         </div>
      </div>
   );
}

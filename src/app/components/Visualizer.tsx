import { useState, useEffect, useRef } from "react";
import { CSS2DObject } from "three/addons/renderers/CSS2DRenderer.js";
import * as THREE from "three";
import {
	setupScene,
	createModel,
	animateScene,
	handleResize,
	addInteractionToLayers,
	calculateCameraPosition,
	addInferenceImage,
	visualizeInferenceOutput,
	resetFocusToModelCenter,
} from "../lib/threeScene";
import { fetchNetworkData, runInference } from "../lib/fetchModel";
import SideBar, { displaySettings, ImageInputSettings } from "./SideBar";
import ScrollTopButton from "./ScrollTopButton";

interface Layer {
	name: string;
	type: string;
	output_shape: string;
}

export interface LayerActivation {
	name: string;
	activations: number[][]; // wielowymiarowa tablica aktywacji dla danej warstwy
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
	const [inferenceFile, setInferenceFile] = useState<File | null>(null);
	const [settingsState, setSettingsState] = useState<displaySettings>({
		showLayerNames: true,
		showLayerDimensions: true,
		colorPalette: "default",
	});
	const [inferenceOutput, setInferenceOutput] = useState<
		LayerActivation[] | null
	>(null);
	const [focusedLayer, setFocusedLayer] = useState<string | null>(null);
	const [imageSettings, setImageSettings] = useState<ImageInputSettings>({
		width: 28,
		height: 28,
		channels: 1,
	});
	const [appliedImageSettings, setAppliedImageSettings] =
		useState<ImageInputSettings>({
			width: 28,
			height: 28,
			channels: 1,
		});
	const [isInferenceLoading, setIsInferenceLoading] = useState(false);
	const [isShapeLoading, setIsShapeLoading] = useState(false);

	const handleRunInference = async (file: File | null) => {
		if (!file) {
			console.error("No inference file provided");
			return;
		}
		setIsInferenceLoading(true);
		try {
			const result = await runInference(
				file,
				data.name || "",
				appliedImageSettings
			);
			setInferenceOutput(result);
			if (sceneRef.current?.scene) {
				visualizeInferenceOutput(sceneRef.current.scene, result);
			}
		} catch (error) {
			console.error("Failed to run inference:", error);
		} finally {
			setIsInferenceLoading(false);
		}
	};

	const handleApplyShape = () => {
		setAppliedImageSettings({ ...imageSettings });
	};

	useEffect(() => {
		if (!data) return;

		setLoading(true);
		setIsShapeLoading(true);
		setError(null);

		fetchNetworkData(data, appliedImageSettings)
			.then(setModelData)
			.catch((err) => setError(err.message))
			.finally(() => {
				setLoading(false);
				setIsShapeLoading(false);
			});

		visualizerRef.current?.scrollIntoView({ behavior: "smooth" });
		console.log("Data loaded:", data);
		console.log("Model data:", modelData);
		console.log("Model data:", modelData?.layers);
	}, [data, appliedImageSettings]);

	// Initialize and render the 3D scene when modelData changes
	useEffect(() => {
		if (!containerRef.current || !modelData) return;

		const sceneSetup = setupScene(containerRef.current);
		if (!sceneSetup) return;

		sceneRef.current = sceneSetup;
		const { scene, camera, renderer, labelRenderer, controls } = sceneSetup;

		modelRef.current = createModel(modelData.layers, settingsState);
		scene.add(modelRef.current);

		// Store controls in camera's userData for the calculateCameraPosition function
		camera.userData.controls = controls;

		// Calculate and set camera position based on model dimensions
		calculateCameraPosition(modelRef.current, camera);

		animateScene(renderer, labelRenderer, scene, camera, controls);
		const cleanupResize = handleResize(camera, renderer, labelRenderer);

		// Add interaction with layer focus callback
		const cleanupInteraction = addInteractionToLayers(
			containerRef.current,
			camera,
			scene,
			controls,
			(layerName) => setFocusedLayer(layerName)
		);

		// ESC key handler to reset focus to model center
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape" && modelRef.current) {
				resetFocusToModelCenter(modelRef.current, controls);
				setFocusedLayer(null);
			}
		};
		window.addEventListener("keydown", handleKeyDown);

		if (inferenceFile) {
			addInferenceImage(
				containerRef.current,
				camera,
				scene,
				inferenceFile
			);
			animateScene(renderer, labelRenderer, scene, camera, controls);
		}

		return () => {
			cleanupResize();
			cleanupInteraction();
			window.removeEventListener("keydown", handleKeyDown);
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
					if (mesh.material)
						(mesh.material as THREE.Material).dispose();
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

		// Re-apply inference image if it exists
		if (inferenceFile && containerRef.current) {
			addInferenceImage(
				containerRef.current,
				camera,
				scene,
				inferenceFile
			);
		}

		renderer.render(scene, camera);
		labelRenderer.render(scene, camera);
	}, [settingsState]);

	// Handle inference file changes
	useEffect(() => {
		if (!inferenceFile || !containerRef.current || !sceneRef.current)
			return;

		const { scene, camera, renderer, labelRenderer } = sceneRef.current;

		addInferenceImage(containerRef.current, camera, scene, inferenceFile);

		renderer.render(scene, camera);
		labelRenderer.render(scene, camera);
	}, [inferenceFile]);

	return (
		<div ref={visualizerRef} className="relative w-full min-h-screen flex">
			<h2
				className={`absolute top-2 left-15 text-2xl font-semibold text-zinc-900 p-4 z-50 transform transition-transform duration-300 ease-in-out
               ${isSidebarOpen ? "translate-x-50" : "translate-x-0"}`}
			>
				{modelData && <div>{data.name}</div>}
			</h2>
			{/* Focused layer indicator */}
			{focusedLayer && (
				<div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-zinc-900 text-white px-4 py-2 rounded-lg z-50 flex items-center gap-3 shadow-lg backdrop-blur-sm">
					<span className="text-sm">
						Focused:{" "}
						<span className="font-semibold text-amber-400">
							{focusedLayer}
						</span>
					</span>
					<span className="text-xs text-zinc-400 border-l border-zinc-600 pl-3">
						Press{" "}
						<kbd className="bg-zinc-700 px-1.5 py-0.5 rounded text-xs font-mono">
							ESC
						</kbd>{" "}
						to reset
					</span>
				</div>
			)}
			<SideBar
				isOpen={isSidebarOpen}
				setIsOpen={setIsSidebarOpen}
				settings={settingsState}
				setSettings={setSettingsState}
				inferenceFile={inferenceFile}
				setInferenceFile={setInferenceFile}
				runInference={handleRunInference}
				imageSettings={imageSettings}
				setImageSettings={setImageSettings}
				isInferenceLoading={isInferenceLoading}
				onApplyShape={handleApplyShape}
				isShapeLoading={isShapeLoading}
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
// TODO: add sad face when can't parse object with a message how to save a model in a way
// that is compatible with the application parser

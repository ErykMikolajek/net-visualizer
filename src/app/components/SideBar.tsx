import { Menu, Reply, Download } from "lucide-react";

export interface displaySettings {
	showLayerNames: boolean;
	showLayerDimensions: boolean;
	colorPalette: string;
}

export default function SideBar({
	isOpen,
	setIsOpen,
	settings,
	setSettings,
	inferenceFile,
	setInferenceFile,
	runInference,
}: {
	isOpen: boolean;
	setIsOpen: (open: boolean) => void;
	settings: displaySettings;
	setSettings: (settings: displaySettings) => void;
	inferenceFile: File | null;
	setInferenceFile: (file: File | null) => void;
	runInference: (file: File | null) => void;
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
					<h2 className="text-xl font-semibold text-zinc-900 mb-3">
						Run Inference
					</h2>
					<p className="text-sm text-zinc-900 mb-2">
						Choose input file for inference
					</p>
					<div className="flex items-center justify-center w-full cursor-pointer">
						<label
							htmlFor="dropzone-file"
							className="flex flex-col items-center justify-center w-full h-64 bg-zinc-50 border border-dashed border-zinc-300 rounded-xl cursor-pointer hover:bg-zinc-100"
						>
							<div className="flex flex-col items-center justify-center text-zinc-900 p-4 text-center">
								<svg
									className="w-8 h-8 mb-4"
									aria-hidden="true"
									xmlns="http://www.w3.org/2000/svg"
									width="24"
									height="24"
									fill="none"
									viewBox="0 0 24 24"
								>
									<path
										stroke="currentColor"
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M15 17h3a3 3 0 0 0 0-6h-.025a5.56 5.56 0 0 0 .025-.5A5.5 5.5 0 0 0 7.207 9.021C7.137 9.017 7.071 9 7 9a4 4 0 1 0 0 8h2.167M12 19v-9m0 0-2 2m2-2 2 2"
									/>
								</svg>
								<p className="mb-2 text-sm">
									<span className="font-semibold">
										Click to upload
									</span>{" "}
									or drag and drop
								</p>
							</div>
							<input
								id="dropzone-file"
								type="file"
								className="hidden"
								onChange={(e) => {
									setInferenceFile(
										e.target.files?.[0] || null
									);
								}}
							/>
						</label>
					</div>
					<button
						onClick={() => runInference(inferenceFile || null)}
						className="bg-zinc-900 text-zinc-50 px-4 py-2 text-xl font-semibold rounded-xl hover:bg-zinc-800 transition-colors duration-200 mb-6 mt-2"
					>
						Run
					</button>
					<h2 className="text-xl font-semibold text-zinc-900 mb-4">
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
										showLayerNames:
											!settings.showLayerNames,
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
						<h3 className="pb-1 pt-3 text-md font-semibold text-zinc-900">
							Colors
						</h3>
						<div className="flex flex-row items-center">
							<label
								htmlFor="colorPalette"
								className="mr-2 block text-sm text-zinc-700"
							>
								Color Palette:
							</label>
							<select
								id="colorPalette"
								value={settings.colorPalette}
								onChange={(e) => {
									setSettings({
										...settings,
										colorPalette: e.target.value,
									});
									console.log(e.target.value);
								}}
								className="h-8 px-2 text-zinc-700 border border-zinc-300 rounded bg-white focus:ring-zinc-500"
							>
								<option value="default">Default</option>
								<option value="dark">Dark</option>
								<option value="tailwind">Tailwind</option>
								<option value="neon">Neon</option>
								<option value="natural">Natural</option>
							</select>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

import React from "react";
import {
	CloudIcon,
	ServerIcon,
	PlusIcon,
	EyeIcon,
	InformationCircleIcon,
	CpuChipIcon,
} from "@heroicons/react/24/outline";
import { useNodes, useNetworkConfig, useActiveTab, useValidation } from "../hooks/useAppStore.js";
import { generateNextNodeId, generateDefaultNode } from "../utils/nodeUtils.js";
import { validateConfiguration } from "../utils/validation.js";
import NodeManager from "./NodeManager.js";
import NetworkConfigForm from "./NetworkConfigForm.js";
import TutorialGenerator from "./TutorialGenerator.js";
import NetworkVisualization from "./NetworkVisualization.js";
import SpecificationPanel from "./SpecificationPanel.js";
import HelpPage from "./HelpPage.js";

const KollaHelper: React.FC = () => {
	const { nodes, addNode, updateNode, removeNode } = useNodes();
	const { networkConfig, setNetworkConfig } = useNetworkConfig();
	const { activeTab, setActiveTab } = useActiveTab();
	const { validation, setValidation } = useValidation();

	const handleAddNode = () => {
		const newId = generateNextNodeId(nodes);
		const newNode = generateDefaultNode(newId, nodes, networkConfig);
		addNode(newNode);
	};

	const handleValidation = () => {
		const result = validateConfiguration(nodes, networkConfig);
		setValidation(result);
	};

	const renderTabButton = (
		tab: "nodes" | "network" | "specifications" | "visualization" | "tutorial" | "help",
		label: string,
		icon: React.ReactNode
	) => (
		<button
			onClick={() => setActiveTab(tab)}
			className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
				activeTab === tab
					? "bg-blue-600 text-white shadow-lg"
					: "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
			}`}
		>
			{icon}
			<span>{label}</span>
		</button>
	);

	const renderTabContent = () => {
		switch (activeTab) {
			case "nodes":
				return (
					<div className="glass-card p-6">
						<div className="flex items-center justify-between mb-6">
							<h2 className="text-2xl font-semibold text-gray-800 flex items-center">
								<ServerIcon className="h-6 w-6 mr-2" />
								Node Management
							</h2>
							<button onClick={handleAddNode} className="btn-secondary flex items-center">
								<PlusIcon className="h-5 w-5 mr-2" />
								Add Node
							</button>
						</div>
						<NodeManager
							nodes={nodes}
							networkConfig={networkConfig}
							onNodeUpdate={updateNode}
							onNodeRemove={removeNode}
						/>
					</div>
				);
			case "network":
				return (
					<div className="glass-card p-6">
						<h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
							<ServerIcon className="h-6 w-6 mr-2" />
							Network Configuration
						</h2>
						<NetworkConfigForm config={networkConfig} onChange={setNetworkConfig} />
					</div>
				);
			case "specifications":
				return <SpecificationPanel nodes={nodes} networkConfig={networkConfig} />;
			case "visualization":
				return <NetworkVisualization nodes={nodes} networkConfig={networkConfig} />;
			case "tutorial":
				return (
					<>
						{/* Generate Tutorial Button */}
						<div className="text-center mb-8">
							<button onClick={handleValidation} className="btn-primary text-lg px-8 py-4">
								Generate Tutorial
							</button>
						</div>

						{/* Validation Results */}
						{validation.message && (
							<div className="glass-card p-6 mb-8">
								<div className="flex items-center mb-4">
									<h3 className="text-xl font-semibold text-gray-800">Validation Results</h3>
									<span
										className={`ml-4 px-3 py-1 rounded-full text-sm font-medium ${
											validation.isValid
												? "bg-green-100 text-green-800"
												: "bg-red-100 text-red-800"
										}`}
									>
										{validation.isValid ? "Pass" : "Fail"}
									</span>
								</div>
								<p className="text-gray-700 mb-4">{validation.message}</p>
								{validation.details && validation.details.length > 0 && (
									<ul className="list-disc pl-5 space-y-1">
										{validation.details.map((detail, index) => {
											// Determine if this is a positive (valid) or negative (invalid) message
											const isPositive =
												detail.includes("is a valid") ||
												detail.includes("is valid") ||
												detail.includes("passed") ||
												detail.includes("available for floating IPs on:") ||
												detail.includes("present in the deployment") ||
												detail.includes("All required roles");

											const isNegative =
												detail.includes("invalid") ||
												detail.includes("Duplicate") ||
												detail.includes("Error") ||
												detail.includes("cannot") ||
												detail.includes("must") ||
												detail.includes("Missing") ||
												detail.includes("At least one") ||
												detail.includes("already used") ||
												(detail.includes("required for") && !detail.includes("present"));

											return (
												<li
													key={index}
													className={`text-sm ${
														isPositive
															? "text-green-700 font-medium"
															: isNegative
															? "text-red-700 font-medium"
															: "text-gray-600"
													}`}
												>
													{detail}
												</li>
											);
										})}
									</ul>
								)}
							</div>
						)}

						{/* Tutorial */}
						{validation.isValid && <TutorialGenerator nodes={nodes} networkConfig={networkConfig} />}
					</>
				);
			case "help":
				return <HelpPage />;
			default:
				return null;
		}
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
			<div className="max-w-7xl mx-auto">
				{/* Header */}
				<div className="glass-card p-8 mb-8 text-center">
					<div className="flex items-center justify-center mb-4">
						<CloudIcon className="h-12 w-12 text-blue-600 mr-4" />
						<h1 className="text-4xl font-bold text-gray-800">Kolla OpenStack Installation Helper</h1>
					</div>
					<p className="text-xl text-gray-600">Dynamic Node Configuration for Multi-Node Deployment</p>
				</div>

				{/* Tab Navigation */}
				<div className="glass-card p-6 mb-8">
					<div className="flex flex-wrap gap-4 justify-center">
						{renderTabButton("nodes", "Node Management", <ServerIcon className="h-5 w-5" />)}
						{renderTabButton("network", "Network Config", <CloudIcon className="h-5 w-5" />)}
						{renderTabButton("specifications", "Specifications", <CpuChipIcon className="h-5 w-5" />)}
						{renderTabButton("visualization", "Network Topology", <EyeIcon className="h-5 w-5" />)}
						{renderTabButton("tutorial", "Tutorial", <PlusIcon className="h-5 w-5" />)}
						{renderTabButton("help", "Help Guide", <InformationCircleIcon className="h-5 w-5" />)}
					</div>
				</div>

				{/* Tab Content */}
				{renderTabContent()}
			</div>
		</div>
	);
};

export default KollaHelper;

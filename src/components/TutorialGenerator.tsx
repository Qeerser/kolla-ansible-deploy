import React, { useState } from "react";
import type { Node, NetworkConfig } from "../types/index.js";
import { TutorialDataService } from "../services/TutorialDataService.js";
import CommandBlock from "./ui/CommandBlock.js";

interface TutorialGeneratorProps {
	nodes: Node[];
	networkConfig: NetworkConfig;
}

const TutorialGenerator: React.FC<TutorialGeneratorProps> = ({ nodes, networkConfig }) => {
	const [copiedIndex, setCopiedIndex] = useState<string | number | null>(null);
	const [copiedType, setCopiedType] = useState<string | null>(null);
	const [activeNodeTabs, setActiveNodeTabs] = useState<{ [stepId: number]: string }>({});

	const copyToClipboard = async (text: string, index: string | number, type?: string) => {
		try {
			await navigator.clipboard.writeText(text);
			setCopiedIndex(index);
			setCopiedType(type || null);
			setTimeout(() => {
				setCopiedIndex(null);
				setCopiedType(null);
			}, 2000);
		} catch (err) {
			console.error("Failed to copy text: ", err);
		}
	};

	const setActiveTab = (stepId: number, nodeId: string) => {
		setActiveNodeTabs((prev) => ({ ...prev, [stepId]: nodeId }));
	};

	const tutorialSteps = TutorialDataService.generateTutorialSteps(nodes, networkConfig);

	return (
		<div className="glass-card p-6">
			<h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
				🚀 OpenStack Kolla-Ansible 2025.1 Installation Tutorial (Debian 12)
			</h2>

			<div className="space-y-6">
				{tutorialSteps.map((step) => (
					<div key={step.id} className="bg-white rounded-lg shadow-sm border border-gray-200">
						<div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200 rounded-t-lg">
							<h3 className="text-lg font-semibold text-gray-800">
								Step {step.id}: {step.title}
							</h3>
							<p className="text-sm text-gray-600 mt-1">{step.description}</p>
						</div>

						<div className="p-6">
							{/* Regular commands for steps without node-specific commands */}
							{step.commands && (
								<CommandBlock
									commands={step.commands}
									title={`Step ${step.id} Commands`}
									index={step.id}
									onCopy={copyToClipboard}
									copiedIndex={copiedIndex}
									copiedType={copiedType || undefined}
								/>
							)}

							{/* Node-specific commands with tabs */}
							{step.nodeCommands && (
								<div>
									{/* Node tabs */}
									<div className="flex flex-wrap border-b border-gray-200 mb-4">
										{step.nodeCommands.map((nodeCmd) => {
											const isActive =
												activeNodeTabs[step.id] === nodeCmd.nodeId ||
												(!activeNodeTabs[step.id] &&
													step.nodeCommands![0].nodeId === nodeCmd.nodeId);
											return (
												<button
													key={nodeCmd.nodeId}
													onClick={() => setActiveTab(step.id, nodeCmd.nodeId)}
													className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
														isActive
															? "border-blue-500 text-blue-600 bg-blue-50"
															: "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
													}`}
												>
													{nodeCmd.hostname}
													<span className="ml-2 text-xs text-gray-400">
														({nodeCmd.nodeType})
													</span>
												</button>
											);
										})}
									</div>

									{/* Active node commands */}
									{step.nodeCommands.map((nodeCmd) => {
										const isActive =
											activeNodeTabs[step.id] === nodeCmd.nodeId ||
											(!activeNodeTabs[step.id] &&
												step.nodeCommands![0].nodeId === nodeCmd.nodeId);
										if (!isActive) return null;

										return (
											<div key={nodeCmd.nodeId}>
												<CommandBlock
													commands={nodeCmd.commands}
													title={`Commands for ${nodeCmd.hostname} (${nodeCmd.nodeType})`}
													index={`${step.id}-${nodeCmd.nodeId}`}
													onCopy={copyToClipboard}
													copiedIndex={copiedIndex}
													copiedType={copiedType || undefined}
												/>
											</div>
										);
									})}
								</div>
							)}
						</div>
					</div>
				))}
			</div>
		</div>
	);
};

export default TutorialGenerator;

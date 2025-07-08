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

	const copyToClipboard = async (text: string, index: string | number) => {
		try {
			await navigator.clipboard.writeText(text);
			setCopiedIndex(index);
			setTimeout(() => setCopiedIndex(null), 2000);
		} catch (err) {
			console.error("Failed to copy text: ", err);
		}
	};

	const tutorialSteps = TutorialDataService.generateTutorialSteps(nodes, networkConfig);

	return (
		<div className="glass-card p-6">
			<h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
				🚀 OpenStack Installation Tutorial
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
							<CommandBlock
								commands={step.commands}
								title={`Step ${step.id} Commands`}
								index={step.id}
								onCopy={copyToClipboard}
								copiedIndex={copiedIndex}
							/>
						</div>
					</div>
				))}
			</div>
		</div>
	);
};

export default TutorialGenerator;

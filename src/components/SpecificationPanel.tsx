import React from "react";
import type { Node, NetworkConfig } from "../types/index.js";
import { SpecificationService } from "../services/SpecificationService.js";

interface SpecificationPanelProps {
	nodes: Node[];
	networkConfig: NetworkConfig;
}

const SpecificationPanel: React.FC<SpecificationPanelProps> = ({ nodes, networkConfig }) => {
	const specification = SpecificationService.generateSystemSpecification(nodes, networkConfig);

	return (
		<div className="glass-card p-6">
			<h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
				📊 System Specifications & Recommendations
			</h2>

			{/* Hardware Specifications Table */}
			<div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
				<div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200 rounded-t-lg">
					<h3 className="text-lg font-semibold text-gray-800">💻 Minimum Hardware Specifications</h3>
				</div>

				<div className="p-6 overflow-x-auto">
					<table className="w-full table-auto border-collapse">
						<thead>
							<tr className="bg-gray-50">
								<th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-800">
									Node Name
								</th>
								<th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-800">
									CPU Cores
								</th>
								<th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-800">
									RAM
								</th>
								<th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-800">
									Storage
								</th>
								<th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-800">
									NICs
								</th>
							</tr>
						</thead>
						<tbody>
							{specification.nodes.map((node, index) => (
								<tr key={index} className="hover:bg-gray-50">
									<td className="border border-gray-300 px-4 py-2 font-medium text-gray-800">
										{node.name}
									</td>
									<td className="border border-gray-300 px-4 py-2 text-gray-700">{node.cpuCores}</td>
									<td className="border border-gray-300 px-4 py-2 text-gray-700">{node.ram}</td>
									<td className="border border-gray-300 px-4 py-2 text-gray-700">
										<div className="space-y-1">
											{node.storage.map((storage, idx) => (
												<div key={idx} className="text-sm">
													{storage}
												</div>
											))}
										</div>
									</td>
									<td className="border border-gray-300 px-4 py-2 text-gray-700">
										{node.networkInterfaces}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>

			{/* System Summary */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
				<div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
					<div className="text-blue-800 font-semibold text-lg">{specification.totalCpuCores}</div>
					<div className="text-blue-600 text-sm">Total CPU Cores</div>
				</div>
				<div className="bg-green-50 rounded-lg p-4 border border-green-200">
					<div className="text-green-800 font-semibold text-lg">{specification.totalRam}GB</div>
					<div className="text-green-600 text-sm">Total RAM</div>
				</div>
				<div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
					<div className="text-purple-800 font-semibold text-lg">{specification.totalStorage}GB+</div>
					<div className="text-purple-600 text-sm">Total Storage</div>
				</div>
			</div>

			{/* Network Requirements */}
			<div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
				<div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-gray-200 rounded-t-lg">
					<h3 className="text-lg font-semibold text-gray-800">🌐 Network Requirements</h3>
				</div>

				<div className="p-6">
					<ul className="space-y-2">
						{specification.networkRequirements.map((req, index) => (
							<li key={index} className="flex items-start">
								<span className="text-green-500 font-bold mr-2">•</span>
								<span className="text-gray-700">{req}</span>
							</li>
						))}
					</ul>
				</div>
			</div>

			{/* Recommendations */}
			<div className="bg-white rounded-lg shadow-sm border border-gray-200">
				<div className="bg-gradient-to-r from-yellow-50 to-orange-50 px-6 py-4 border-b border-gray-200 rounded-t-lg">
					<h3 className="text-lg font-semibold text-gray-800">💡 Deployment Recommendations</h3>
				</div>

				<div className="p-6">
					<ul className="space-y-3">
						{specification.recommendations.map((rec, index) => (
							<li key={index} className="flex items-start">
								<span className="text-orange-500 font-bold mr-2 mt-0.5">•</span>
								<span className="text-gray-700 leading-relaxed">{rec}</span>
							</li>
						))}
					</ul>
				</div>
			</div>

			{/* Note about VM creation */}
			<div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
				<p className="text-blue-800 text-sm">
					<strong>Note:</strong> These specifications are based on your current configuration. The original
					implementation used QEMU-KVM and cloud-init for VM creation. You can adjust resources based on your
					workload requirements and available hardware.
				</p>
			</div>
		</div>
	);
};

export default SpecificationPanel;

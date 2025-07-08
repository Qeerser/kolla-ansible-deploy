import React from "react";
import {
	ServerIcon,
	CloudIcon,
	CircleStackIcon,
	CpuChipIcon,
	WifiIcon,
	GlobeAltIcon,
} from "@heroicons/react/24/outline";
import type { Node, NetworkConfig } from "../types/index.js";

interface NetworkVisualizationProps {
	nodes: Node[];
	networkConfig: NetworkConfig;
}

const NetworkVisualization: React.FC<NetworkVisualizationProps> = ({ nodes, networkConfig }) => {
	const controllerNodes = nodes.filter((node) => node.type === "controller");
	const networkNodes = nodes.filter((node) => node.type === "network");
	const computeNodes = nodes.filter((node) => node.type === "compute");
	const storageNodes = nodes.filter((node) => node.type === "storage");
	const hybridNodes = nodes.filter((node) => node.type === "hybrid");

	const getNodeIcon = (type: string) => {
		switch (type) {
			case "controller":
				return <ServerIcon className="h-8 w-8" />;
			case "network":
				return <WifiIcon className="h-8 w-8" />;
			case "compute":
				return <CpuChipIcon className="h-8 w-8" />;
			case "storage":
				return <CircleStackIcon className="h-8 w-8" />;
			case "hybrid":
				return <CloudIcon className="h-8 w-8" />;
			default:
				return <CloudIcon className="h-8 w-8" />;
		}
	};

	const getNodeColor = (type: string) => {
		switch (type) {
			case "controller":
				return "bg-blue-500 text-white";
			case "network":
				return "bg-green-500 text-white";
			case "compute":
				return "bg-purple-500 text-white";
			case "storage":
				return "bg-orange-500 text-white";
			case "hybrid":
				return "bg-gradient-to-r from-blue-500 to-purple-500 text-white";
			default:
				return "bg-gray-500 text-white";
		}
	};

	const getHybridRolesSummary = (node: Node): string => {
		if (node.type !== "hybrid" || !node.hybridRoles) return "";

		const roles = [];
		if (node.hybridRoles.controller) roles.push("C");
		if (node.hybridRoles.network) roles.push("N");
		if (node.hybridRoles.compute) roles.push("CM");
		if (node.hybridRoles.storage) roles.push("S");

		return roles.length > 0 ? ` (${roles.join("+")})` : "";
	};

	const renderNodeCard = (node: Node) => (
		<div key={node.id} className="relative">
			<div className={`p-4 rounded-lg shadow-lg ${getNodeColor(node.type)} min-w-48`}>
				<div className="flex items-center space-x-3 mb-3">
					{getNodeIcon(node.type)}
					<div>
						<h3 className="font-semibold text-lg">{node.hostname}</h3>
						<p className="text-sm opacity-90 capitalize">
							{node.type}
							{getHybridRolesSummary(node)}
						</p>
					</div>
				</div>

				<div className="space-y-2 text-sm">
					<div className="bg-white/20 rounded p-2">
						<div className="font-medium">Management Network</div>
						<div className="text-xs opacity-90">
							{node.managementNic.name}: {node.managementNic.ip}
						</div>
					</div>

					{node.tunnelNic && (
						<div className="bg-white/20 rounded p-2">
							<div className="font-medium">Tunnel Network</div>
							<div className="text-xs opacity-90">
								{node.tunnelNic.name}: {node.tunnelNic.ip}
							</div>
						</div>
					)}

					{node.externalNic && (
						<div className="bg-white/20 rounded p-2">
							<div className="font-medium">External Network</div>
							<div className="text-xs opacity-90">
								{node.externalNic.name}: {node.externalNic.ip || "No IP"}
							</div>
						</div>
					)}

					{node.vipExternalNic && (
						<div className="bg-white/20 rounded p-2">
							<div className="font-medium">VIP External</div>
							<div className="text-xs opacity-90">
								{node.vipExternalNic.name}: {node.vipExternalNic.ip || "No IP"}
							</div>
						</div>
					)}

					{node.storageDisks && node.storageDisks.length > 0 && (
						<div className="bg-white/20 rounded p-2">
							<div className="font-medium">Storage Disks</div>
							<div className="text-xs opacity-90">
								{node.storageDisks.map((disk) => disk.name).join(", ")}
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);

	const renderNetworkGroup = (title: string, nodes: Node[], bgColor: string) => {
		if (nodes.length === 0) return null;

		return (
			<div className={`p-4 rounded-lg border-2 border-dashed ${bgColor} bg-opacity-10`}>
				<h3 className="font-semibold text-lg mb-4 text-center">{title}</h3>
				<div className="flex flex-wrap gap-4 justify-center">{nodes.map((node) => renderNodeCard(node))}</div>
			</div>
		);
	};

	return (
		<div className="glass-card p-6">
			<h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center flex items-center justify-center space-x-2">
				<GlobeAltIcon className="h-8 w-8" />
				<span>Network Topology Visualization</span>
			</h2>

			{/* Network Configuration Summary */}
			<div className="mb-8 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
				<h3 className="font-semibold text-lg mb-3">Network Configuration Summary</h3>
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
					<div>
						<span className="font-medium">Kolla Internal VIP:</span>
						<div className="text-blue-600">{networkConfig.kollaIntVipAddr}</div>
					</div>
					<div>
						<span className="font-medium">External Network:</span>
						<div className="text-green-600">{networkConfig.externalCidr}</div>
					</div>
					<div>
						<span className="font-medium">External Gateway:</span>
						<div className="text-purple-600">{networkConfig.extGatewayIp}</div>
					</div>
					<div>
						<span className="font-medium">IP Range:</span>
						<div className="text-orange-600">
							{networkConfig.extStartIp} - {networkConfig.extEndIp}
						</div>
					</div>
					<div>
						<span className="font-medium">Kolla User:</span>
						<div className="text-gray-600">{networkConfig.kollaUser}</div>
					</div>
					<div>
						<span className="font-medium">Total Nodes:</span>
						<div className="text-indigo-600 font-semibold">{nodes.length}</div>
					</div>
				</div>

				{/* Node Statistics */}
				<div className="mt-4 pt-4 border-t border-blue-200">
					<h4 className="font-medium text-gray-700 mb-2">Node Distribution</h4>
					<div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
						<div className="flex items-center space-x-2">
							<div className="w-3 h-3 bg-blue-500 rounded-full"></div>
							<span>Controller: {controllerNodes.length}</span>
						</div>
						<div className="flex items-center space-x-2">
							<div className="w-3 h-3 bg-green-500 rounded-full"></div>
							<span>Network: {networkNodes.length}</span>
						</div>
						<div className="flex items-center space-x-2">
							<div className="w-3 h-3 bg-purple-500 rounded-full"></div>
							<span>Compute: {computeNodes.length}</span>
						</div>
						<div className="flex items-center space-x-2">
							<div className="w-3 h-3 bg-orange-500 rounded-full"></div>
							<span>Storage: {storageNodes.length}</span>
						</div>
						<div className="flex items-center space-x-2">
							<div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
							<span>Hybrid: {hybridNodes.length}</span>
						</div>
					</div>
				</div>
			</div>

			{/* Network Topology */}
			<div className="space-y-6">
				{/* Management Network - All nodes connect here */}
				<div className="relative">
					<div className="text-center mb-4">
						<h3 className="text-lg font-semibold text-gray-700 bg-blue-100 inline-block px-4 py-2 rounded-full">
							Management Network (
							{nodes.length > 0
								? nodes[0].managementNic.ip.split(".").slice(0, 3).join(".")
								: "172.16.38"}
							.0/24)
						</h3>
					</div>

					{/* Horizontal line representing management network */}
					<div className="absolute top-1/2 left-0 right-0 h-1 bg-blue-300 transform -translate-y-1/2 z-0"></div>

					<div className="relative z-10 flex flex-wrap justify-center gap-6">
						{nodes.map((node) => (
							<div key={node.id} className="text-center">
								<div className="mb-2">
									<div
										className={`w-4 h-4 rounded-full mx-auto ${getNodeColor(node.type).replace(
											"text-white",
											"border-2 border-white"
										)}`}
									></div>
									<div className="w-px h-8 bg-blue-300 mx-auto"></div>
								</div>
								{renderNodeCard(node)}
							</div>
						))}
					</div>
				</div>

				{/* Tunnel Network - for network, compute, and hybrid nodes */}
				{(networkNodes.length > 0 || computeNodes.length > 0 || hybridNodes.length > 0) && (
					<div className="relative mt-12">
						<div className="text-center mb-4">
							<h3 className="text-lg font-semibold text-gray-700 bg-green-100 inline-block px-4 py-2 rounded-full">
								Tunnel Network (10.77.0.0/24)
							</h3>
						</div>

						{/* Horizontal line representing tunnel network */}
						<div className="absolute top-1/2 left-0 right-0 h-1 bg-green-300 transform -translate-y-1/2 z-0"></div>

						<div className="relative z-10 flex flex-wrap justify-center gap-6">
							{[...networkNodes, ...computeNodes, ...hybridNodes]
								.filter((node) => node.tunnelNic)
								.map((node) => (
									<div key={node.id} className="text-center">
										<div className="mb-2">
											<div
												className={`w-4 h-4 rounded-full mx-auto ${getNodeColor(
													node.type
												).replace("text-white", "border-2 border-white")}`}
											></div>
											<div className="w-px h-8 bg-green-300 mx-auto"></div>
										</div>
										<div className="bg-white/90 p-2 rounded shadow">
											<div className="text-sm font-medium">{node.hostname}</div>
											<div className="text-xs text-gray-600">{node.tunnelNic?.ip}</div>
										</div>
									</div>
								))}
						</div>
					</div>
				)}

				{/* External Network - for network nodes and hybrid nodes */}
				{(networkNodes.some((node) => node.externalNic) || hybridNodes.some((node) => node.externalNic)) && (
					<div className="relative mt-12">
						<div className="text-center mb-4">
							<h3 className="text-lg font-semibold text-gray-700 bg-purple-100 inline-block px-4 py-2 rounded-full">
								External Network ({networkConfig.externalCidr})
							</h3>
						</div>

						{/* Horizontal line representing external network */}
						<div className="absolute top-1/2 left-0 right-0 h-1 bg-purple-300 transform -translate-y-1/2 z-0"></div>

						<div className="relative z-10 flex flex-wrap justify-center gap-6">
							{[...networkNodes, ...hybridNodes]
								.filter((node) => node.externalNic)
								.map((node) => (
									<div key={node.id} className="text-center">
										<div className="mb-2">
											<div
												className={`w-4 h-4 rounded-full mx-auto ${getNodeColor(
													node.type
												).replace("text-white", "border-2 border-white")}`}
											></div>
											<div className="w-px h-8 bg-purple-300 mx-auto"></div>
										</div>
										<div className="bg-white/90 p-2 rounded shadow">
											<div className="text-sm font-medium">{node.hostname}</div>
											<div className="text-xs text-gray-600">{node.externalNic?.name}</div>
										</div>
									</div>
								))}
						</div>
					</div>
				)}
			</div>

			{/* Node Groups */}
			<div className="mt-12 space-y-6">
				<h3 className="text-xl font-semibold text-gray-800 text-center">Node Groups</h3>

				{renderNetworkGroup("Controller Nodes", controllerNodes, "border-blue-500")}
				{renderNetworkGroup("Network Nodes", networkNodes, "border-green-500")}
				{renderNetworkGroup("Compute Nodes", computeNodes, "border-purple-500")}
				{renderNetworkGroup("Storage Nodes", storageNodes, "border-orange-500")}
				{renderNetworkGroup("Hybrid Nodes", hybridNodes, "border-gradient-to-r from-blue-500 to-purple-500")}
			</div>

			{/* Legend */}
			<div className="mt-8 p-4 bg-gray-50 rounded-lg">
				<h4 className="font-semibold text-gray-700 mb-3">Legend</h4>
				<div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
					<div className="flex items-center space-x-2">
						<div className="w-4 h-4 bg-blue-500 rounded"></div>
						<span>Controller</span>
					</div>
					<div className="flex items-center space-x-2">
						<div className="w-4 h-4 bg-green-500 rounded"></div>
						<span>Network</span>
					</div>
					<div className="flex items-center space-x-2">
						<div className="w-4 h-4 bg-purple-500 rounded"></div>
						<span>Compute</span>
					</div>
					<div className="flex items-center space-x-2">
						<div className="w-4 h-4 bg-orange-500 rounded"></div>
						<span>Storage</span>
					</div>
					<div className="flex items-center space-x-2">
						<div className="w-4 h-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded"></div>
						<span>Hybrid</span>
					</div>
				</div>
			</div>
		</div>
	);
};

export default NetworkVisualization;

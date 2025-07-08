import React from "react";
import { TrashIcon, PlusIcon } from "@heroicons/react/24/outline";
import type { Node, NetworkInterface, StorageDisk, HybridRoles, NetworkConfig } from "../types/index.js";
import { generateNextAvailableIP, generateNextAvailableHostname } from "../utils/nodeUtils.js";

interface NodeManagerProps {
	nodes: Node[];
	networkConfig: NetworkConfig;
	onNodeUpdate: (nodeId: string, updatedNode: Node) => void;
	onNodeRemove: (nodeId: string) => void;
}

const NodeManager: React.FC<NodeManagerProps> = ({ nodes, networkConfig, onNodeUpdate, onNodeRemove }) => {
	const updateNodeField = (nodeId: string, field: keyof Node, value: string | Node["type"]) => {
		const node = nodes.find((n) => n.id === nodeId);
		if (node) {
			const updatedNode = { ...node, [field]: value };

			// Handle node type changes - clean up incompatible properties and auto-assign IP/hostname
			if (field === "type") {
				const newType = value as Node["type"]; // Auto-assign hostname and IP based on new type
				updatedNode.hostname = generateNextAvailableHostname(newType, nodes);
				updatedNode.managementNic.ip = generateNextAvailableIP(newType, "management", networkConfig, nodes);

				// Auto-assign tunnel IP for types that need it
				if (newType === "network" || newType === "compute" || newType === "storage" || newType === "hybrid") {
					const tunnelIP = generateNextAvailableIP(newType, "tunnel", networkConfig, nodes);

					// Add or update tunnel NIC
					if (!updatedNode.tunnelNic) {
						updatedNode.tunnelNic = { id: Date.now().toString(), name: "ens4", ip: tunnelIP };
					} else {
						updatedNode.tunnelNic.ip = tunnelIP;
					}
				}

				// Clean up based on new type
				switch (newType) {
					case "controller":
						// Keep only management, external, and vipExternal NICs
						delete updatedNode.storageDisks;
						delete updatedNode.hybridRoles;
						break;
					case "network":
						// Keep management, tunnel, and external NICs
						delete updatedNode.storageDisks;
						delete updatedNode.vipExternalNic;
						delete updatedNode.hybridRoles;
						break;
					case "compute":
						// Keep management and tunnel NICs
						delete updatedNode.storageDisks;
						delete updatedNode.vipExternalNic;
						delete updatedNode.hybridRoles;
						break;
					case "storage":
						// Keep management and tunnel NICs, add storage disks if not exist
						delete updatedNode.vipExternalNic;
						delete updatedNode.hybridRoles;
						if (!updatedNode.storageDisks) {
							updatedNode.storageDisks = [
								{
									id: Date.now().toString(),
									name: "/dev/sdb",
									volumeGroup: "cinder-volumes",
								},
							];
						}
						break;
					case "hybrid":
						// Initialize hybrid roles if not exist
						if (!updatedNode.hybridRoles) {
							updatedNode.hybridRoles = {
								controller: true,
								network: false,
								compute: false,
								storage: false,
							};
						}
						// Add storage disk if storage role is enabled
						if (updatedNode.hybridRoles.storage && !updatedNode.storageDisks) {
							updatedNode.storageDisks = [
								{
									id: Date.now().toString(),
									name: "/dev/sdb",
									volumeGroup: "cinder-volumes",
								},
							];
						}
						break;
				}
			}

			onNodeUpdate(nodeId, updatedNode);
		}
	};

	const updateHybridRole = (nodeId: string, role: keyof HybridRoles, enabled: boolean) => {
		const node = nodes.find((n) => n.id === nodeId);
		if (node && node.type === "hybrid") {
			const updatedNode = { ...node };
			if (!updatedNode.hybridRoles) {
				updatedNode.hybridRoles = {
					controller: false,
					network: false,
					compute: false,
					storage: false,
				};
			}

			updatedNode.hybridRoles[role] = enabled;

			// Handle storage disk when storage role changes
			if (role === "storage") {
				if (enabled && !updatedNode.storageDisks) {
					updatedNode.storageDisks = [
						{
							id: Date.now().toString(),
							name: "/dev/sdb",
							volumeGroup: "cinder-volumes",
						},
					];
				} else if (!enabled) {
					delete updatedNode.storageDisks;
				}
			}

			// Handle VIP external NIC when controller role changes
			if (role === "controller" && !enabled) {
				delete updatedNode.vipExternalNic;
			}

			onNodeUpdate(nodeId, updatedNode);
		}
	};

	const updateNicField = (
		nodeId: string,
		nicType: "managementNic" | "tunnelNic" | "externalNic" | "vipExternalNic",
		field: keyof NetworkInterface,
		value: string
	) => {
		const node = nodes.find((n) => n.id === nodeId);
		if (node) {
			const updatedNode = { ...node };
			if (updatedNode[nicType]) {
				updatedNode[nicType] = { ...updatedNode[nicType]!, [field]: value };
			} else {
				updatedNode[nicType] = {
					id: Date.now().toString(),
					name: field === "name" ? value : "",
					ip: field === "ip" ? value : "",
				} as NetworkInterface;
			}
			onNodeUpdate(nodeId, updatedNode);
		}
	};
	const addNic = (nodeId: string, nicType: "tunnelNic" | "externalNic" | "vipExternalNic") => {
		const node = nodes.find((n) => n.id === nodeId);
		if (node) {
			const updatedNode = { ...node };

			// Auto-assign IP for tunnel NIC based on node type
			if (nicType === "tunnelNic") {
				const tunnelIP = generateNextAvailableIP(node.type, "tunnel", networkConfig, nodes);
				updatedNode[nicType] = { id: Date.now().toString(), name: "ens4", ip: tunnelIP };
			} else {
				updatedNode[nicType] = { id: Date.now().toString(), name: "", ip: "" };
			}

			onNodeUpdate(nodeId, updatedNode);
		}
	};

	const removeNic = (nodeId: string, nicType: "tunnelNic" | "externalNic" | "vipExternalNic") => {
		const node = nodes.find((n) => n.id === nodeId);
		if (node) {
			const updatedNode = { ...node };
			delete updatedNode[nicType];
			onNodeUpdate(nodeId, updatedNode);
		}
	};

	const addStorageDisk = (nodeId: string) => {
		const node = nodes.find((n) => n.id === nodeId);
		if (node) {
			const updatedNode = { ...node };
			if (!updatedNode.storageDisks) {
				updatedNode.storageDisks = [];
			}
			updatedNode.storageDisks.push({
				id: Date.now().toString(),
				name: `/dev/sd${String.fromCharCode(98 + updatedNode.storageDisks.length)}`, // /dev/sdb, /dev/sdc, etc.
				volumeGroup: "cinder-volumes",
			});
			onNodeUpdate(nodeId, updatedNode);
		}
	};

	const removeStorageDisk = (nodeId: string, diskId: string) => {
		const node = nodes.find((n) => n.id === nodeId);
		if (node) {
			const updatedNode = { ...node };
			if (updatedNode.storageDisks) {
				updatedNode.storageDisks = updatedNode.storageDisks.filter((disk) => disk.id !== diskId);
			}
			onNodeUpdate(nodeId, updatedNode);
		}
	};

	const updateStorageDiskField = (nodeId: string, diskId: string, field: keyof StorageDisk, value: string) => {
		const node = nodes.find((n) => n.id === nodeId);
		if (node) {
			const updatedNode = { ...node };
			if (updatedNode.storageDisks) {
				updatedNode.storageDisks = updatedNode.storageDisks.map((disk) =>
					disk.id === diskId ? { ...disk, [field]: value } : disk
				);
			}
			onNodeUpdate(nodeId, updatedNode);
		}
	};

	return (
		<div className="space-y-6">
			{nodes.map((node) => (
				<div key={node.id} className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
					<div className="flex items-center justify-between mb-4">
						<h3 className="text-lg font-semibold text-gray-800">Node: {node.hostname}</h3>
						<button
							onClick={() => onNodeRemove(node.id)}
							className="text-red-500 hover:text-red-700 p-2 rounded-md hover:bg-red-50 transition-colors"
						>
							<TrashIcon className="h-5 w-5" />
						</button>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">Hostname</label>
							<input
								type="text"
								value={node.hostname}
								onChange={(e) => updateNodeField(node.id, "hostname", e.target.value)}
								className="input-field"
								placeholder="e.g., controller01"
							/>
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">Node Type</label>
							<select
								value={node.type}
								onChange={(e) => updateNodeField(node.id, "type", e.target.value)}
								className="input-field"
							>
								<option value="controller">Controller</option>
								<option value="network">Network</option>
								<option value="compute">Compute</option>
								<option value="storage">Storage</option>
								<option value="hybrid">Hybrid</option>
							</select>
						</div>
					</div>

					{/* Hybrid Role Selection */}
					{node.type === "hybrid" && (
						<div className="mb-4">
							<h4 className="text-md font-medium text-gray-700 mb-2">Hybrid Node Roles</h4>
							<div className="grid grid-cols-2 gap-2">
								<label className="flex items-center space-x-2">
									<input
										type="checkbox"
										checked={node.hybridRoles?.controller || false}
										onChange={(e) => updateHybridRole(node.id, "controller", e.target.checked)}
										className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
									/>
									<span className="text-sm text-gray-700">Controller</span>
								</label>
								<label className="flex items-center space-x-2">
									<input
										type="checkbox"
										checked={node.hybridRoles?.network || false}
										onChange={(e) => updateHybridRole(node.id, "network", e.target.checked)}
										className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
									/>
									<span className="text-sm text-gray-700">Network</span>
								</label>
								<label className="flex items-center space-x-2">
									<input
										type="checkbox"
										checked={node.hybridRoles?.compute || false}
										onChange={(e) => updateHybridRole(node.id, "compute", e.target.checked)}
										className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
									/>
									<span className="text-sm text-gray-700">Compute</span>
								</label>
								<label className="flex items-center space-x-2">
									<input
										type="checkbox"
										checked={node.hybridRoles?.storage || false}
										onChange={(e) => updateHybridRole(node.id, "storage", e.target.checked)}
										className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
									/>
									<span className="text-sm text-gray-700">Storage</span>
								</label>
							</div>
							{node.hybridRoles &&
								!node.hybridRoles.controller &&
								!node.hybridRoles.network &&
								!node.hybridRoles.compute &&
								!node.hybridRoles.storage && (
									<div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
										<p className="text-sm text-yellow-800">
											<strong>Warning:</strong> No roles selected for hybrid node.
										</p>
									</div>
								)}
						</div>
					)}

					{/* Warning for tunnel IP requirement */}
					{(node.type === "compute" ||
						node.type === "storage" ||
						node.type === "network" ||
						node.type === "hybrid") &&
						!node.tunnelNic?.ip && (
							<div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
								<div className="flex items-center">
									<div className="w-4 h-4 bg-yellow-500 rounded-full mr-3"></div>
									<p className="text-sm text-yellow-800">
										<strong>Warning:</strong>{" "}
										{node.type === "hybrid"
											? "Hybrid nodes"
											: `${node.type.charAt(0).toUpperCase() + node.type.slice(1)} nodes`}{" "}
										require a tunnel IP address for proper network communication.
									</p>
								</div>
							</div>
						)}

					{/* Management NIC */}
					<div className="mb-4">
						<h4 className="text-md font-medium text-gray-700 mb-2">Management Network Interface</h4>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
							<input
								type="text"
								value={node.managementNic.name}
								onChange={(e) => updateNicField(node.id, "managementNic", "name", e.target.value)}
								className="input-field"
								placeholder="NIC name (e.g., ens3)"
							/>
							<input
								type="text"
								value={node.managementNic.ip}
								onChange={(e) => updateNicField(node.id, "managementNic", "ip", e.target.value)}
								className="input-field"
								placeholder="IP address"
							/>
						</div>
					</div>

					{/* Tunnel NIC */}
					<div className="mb-4">
						<div className="flex items-center justify-between mb-2">
							<h4 className="text-md font-medium text-gray-700">Tunnel Network Interface</h4>
							{!node.tunnelNic ? (
								<button
									onClick={() => addNic(node.id, "tunnelNic")}
									className="text-blue-500 hover:text-blue-700 text-sm"
								>
									Add Tunnel NIC
								</button>
							) : (
								<button
									onClick={() => removeNic(node.id, "tunnelNic")}
									className="text-red-500 hover:text-red-700 text-sm"
								>
									Remove
								</button>
							)}
						</div>
						{node.tunnelNic && (
							<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
								<input
									type="text"
									value={node.tunnelNic.name}
									onChange={(e) => updateNicField(node.id, "tunnelNic", "name", e.target.value)}
									className="input-field"
									placeholder="NIC name (e.g., ens4)"
								/>
								<input
									type="text"
									value={node.tunnelNic.ip}
									onChange={(e) => updateNicField(node.id, "tunnelNic", "ip", e.target.value)}
									className="input-field"
									placeholder="IP address"
								/>
							</div>
						)}
					</div>

					{/* External NIC */}
					<div className="mb-4">
						<div className="flex items-center justify-between mb-2">
							<h4 className="text-md font-medium text-gray-700">External Network Interface</h4>
							{!node.externalNic ? (
								<button
									onClick={() => addNic(node.id, "externalNic")}
									className="text-blue-500 hover:text-blue-700 text-sm"
								>
									Add External NIC
								</button>
							) : (
								<button
									onClick={() => removeNic(node.id, "externalNic")}
									className="text-red-500 hover:text-red-700 text-sm"
								>
									Remove
								</button>
							)}
						</div>
						{node.externalNic && (
							<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
								<input
									type="text"
									value={node.externalNic.name}
									onChange={(e) => updateNicField(node.id, "externalNic", "name", e.target.value)}
									className="input-field"
									placeholder="NIC name (e.g., ens5)"
								/>
								<input
									type="text"
									value={node.externalNic.ip}
									onChange={(e) => updateNicField(node.id, "externalNic", "ip", e.target.value)}
									className="input-field"
									placeholder="IP address (optional)"
								/>
							</div>
						)}
					</div>

					{/* VIP External NIC - Only for controller nodes and hybrid nodes with controller role */}
					{(node.type === "controller" || (node.type === "hybrid" && node.hybridRoles?.controller)) && (
						<div className="mb-4">
							<div className="flex items-center justify-between mb-2">
								<h4 className="text-md font-medium text-gray-700">VIP External Interface</h4>
								<span className="text-xs text-gray-500">Required for external VIP access</span>
								{!node.vipExternalNic ? (
									<button
										onClick={() => addNic(node.id, "vipExternalNic")}
										className="text-blue-500 hover:text-blue-700 text-sm"
									>
										Add VIP External NIC
									</button>
								) : (
									<button
										onClick={() => removeNic(node.id, "vipExternalNic")}
										className="text-red-500 hover:text-red-700 text-sm"
									>
										Remove
									</button>
								)}
							</div>
							{node.vipExternalNic && (
								<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
									<input
										type="text"
										value={node.vipExternalNic.name}
										onChange={(e) =>
											updateNicField(node.id, "vipExternalNic", "name", e.target.value)
										}
										className="input-field"
										placeholder="NIC name (e.g., ens5)"
									/>
									<input
										type="text"
										value={node.vipExternalNic.ip}
										onChange={(e) =>
											updateNicField(node.id, "vipExternalNic", "ip", e.target.value)
										}
										className="input-field"
										placeholder="VIP IP address"
									/>
								</div>
							)}
						</div>
					)}

					{/* Storage Disks - For storage nodes and hybrid nodes with storage role */}
					{(node.type === "storage" || (node.type === "hybrid" && node.hybridRoles?.storage)) && (
						<div className="mb-4">
							<div className="flex items-center justify-between mb-2">
								<h4 className="text-md font-medium text-gray-700">Storage Disks</h4>
								<button
									onClick={() => addStorageDisk(node.id)}
									className="text-blue-500 hover:text-blue-700 text-sm flex items-center"
								>
									<PlusIcon className="h-4 w-4 mr-1" />
									Add Disk
								</button>
							</div>
							{node.storageDisks && node.storageDisks.length > 0 && (
								<div className="space-y-2">
									{node.storageDisks.map((disk) => (
										<div
											key={disk.id}
											className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
										>
											<input
												type="text"
												value={disk.name}
												onChange={(e) =>
													updateStorageDiskField(node.id, disk.id, "name", e.target.value)
												}
												className="input-field flex-1"
												placeholder="Disk path (e.g., /dev/sdb)"
											/>
											<input
												type="text"
												value={disk.volumeGroup}
												onChange={(e) =>
													updateStorageDiskField(
														node.id,
														disk.id,
														"volumeGroup",
														e.target.value
													)
												}
												className="input-field flex-1"
												placeholder="Volume group (e.g., cinder-volumes)"
											/>
											<button
												onClick={() => removeStorageDisk(node.id, disk.id)}
												className="text-red-500 hover:text-red-700 p-2 rounded-md hover:bg-red-50 transition-colors"
											>
												<TrashIcon className="h-4 w-4" />
											</button>
										</div>
									))}
								</div>
							)}
						</div>
					)}
				</div>
			))}
		</div>
	);
};

export default NodeManager;

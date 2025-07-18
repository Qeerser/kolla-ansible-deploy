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
	// Helper function to check if interface name is already used in the same node
	const isInterfaceNameDuplicate = (node: Node, nicType: string, interfaceName: string): boolean => {
		if (!interfaceName.trim()) return false;

		const interfaces = [
			{ type: "management", nic: node.managementNic },
			{ type: "tunnel", nic: node.tunnelNic },
			{ type: "external", nic: node.externalNic },
			{ type: "vipExternal", nic: node.vipExternalNic },
		].filter((item) => item.nic && item.type !== nicType);

		return interfaces.some((item) => item.nic!.name === interfaceName);
	};

	// Helper function to check if node can have external interface (only network nodes or hybrid with network role)
	const canHaveExternalInterface = (node: Node): boolean => {
		if (node.type === "network") return true;
		if (node.type === "hybrid" && node.hybridRoles?.network) return true;
		return false;
	};

	const canHaveTunnelInterface = (node: Node): boolean => {
		if (node.type === "controller") return false;
		if (
			node.type === "hybrid" &&
			!(node.hybridRoles?.network || node.hybridRoles?.compute || node.hybridRoles?.storage)
		)
			return false;
		return true;
	};

	const updateNodeField = (nodeId: string, field: keyof Node, value: string | Node["type"]) => {
		const node = nodes.find((n) => n.id === nodeId);
		if (node) {
			const updatedNode = { ...node, [field]: value };

			// Handle node type changes - clean up incompatible properties and auto-assign IP/hostname
			if (field === "type") {
				const newType = value as Node["type"]; // Auto-assign hostname and IP based on new type
				updatedNode.hostname = generateNextAvailableHostname(newType, nodes);
				updatedNode.managementNic.ip = generateNextAvailableIP(newType, "management", networkConfig, nodes);

				// Auto-assign tunnel IP for types that need it (but not controller)
				if (newType === "network" || newType === "compute" || newType === "storage" || newType === "hybrid") {
					const tunnelIP = generateNextAvailableIP(newType, "tunnel", networkConfig, nodes);

					// Add or update tunnel NIC
					if (!updatedNode.tunnelNic) {
						updatedNode.tunnelNic = { id: Date.now().toString(), name: "ens4", ip: tunnelIP };
					} else {
						updatedNode.tunnelNic.ip = tunnelIP;
					}
				}

				// Clean up based on new type and enforce constraints
				switch (newType) {
					case "controller":
						// Controllers cannot have tunnel interface or external interface
						delete updatedNode.tunnelNic;
						delete updatedNode.externalNic;
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
						// Compute nodes need tunnel interface
						delete updatedNode.externalNic;
						delete updatedNode.storageDisks;
						delete updatedNode.vipExternalNic;
						delete updatedNode.hybridRoles;
						break;
					case "storage":
						// Storage nodes need tunnel interface
						delete updatedNode.externalNic;
						delete updatedNode.vipExternalNic;
						delete updatedNode.hybridRoles;
						// Add storage disks if not exist
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

			// Handle constraints when hybrid roles change
			if (role === "controller") {
				if (enabled) {
					// If controller role is enabled, check if other roles exist
					const hasOtherRoles =
						updatedNode.hybridRoles.network ||
						updatedNode.hybridRoles.compute ||
						updatedNode.hybridRoles.storage;
					if (!hasOtherRoles) {
						// If ONLY controller role, remove tunnel interface
						delete updatedNode.tunnelNic;
					}
					// If controller + other roles, keep tunnel interface for other roles
				} else {
					// If controller role is disabled, remove VIP external NIC
					delete updatedNode.vipExternalNic;
				}
			}

			if (role === "compute") {
				if (enabled) {
					// Compute role: remove external interface (unified constraint handles this)
					delete updatedNode.externalNic;
					if (!updatedNode.tunnelNic) {
						const tunnelIP = generateNextAvailableIP("hybrid", "tunnel", networkConfig, nodes);
						updatedNode.tunnelNic = { id: Date.now().toString(), name: "ens4", ip: tunnelIP };
					}
				}
			}

			if (role === "network") {
				if (enabled) {
					// Network role: ensure tunnel exists
					if (!updatedNode.tunnelNic) {
						const tunnelIP = generateNextAvailableIP("hybrid", "tunnel", networkConfig, nodes);
						updatedNode.tunnelNic = { id: Date.now().toString(), name: "ens4", ip: tunnelIP };
					}
				} else {
					// If network role is disabled, remove external interface (only network nodes can have it)
					delete updatedNode.externalNic;
				}
			}

			// Handle storage disk when storage role changes
			if (role === "storage") {
				if (enabled) {
					// Ensure tunnel exists for storage role
					if (!updatedNode.tunnelNic) {
						const tunnelIP = generateNextAvailableIP("hybrid", "tunnel", networkConfig, nodes);
						updatedNode.tunnelNic = { id: Date.now().toString(), name: "ens4", ip: tunnelIP };
					}
					// Add storage disk if not exists
					if (!updatedNode.storageDisks) {
						updatedNode.storageDisks = [
							{
								id: Date.now().toString(),
								name: "/dev/sdb",
								volumeGroup: "cinder-volumes",
							},
						];
					}
				} else if (!enabled) {
					delete updatedNode.storageDisks;
				}
			}

			// Final check: If ONLY controller role is enabled, remove tunnel interface
			const hasOtherRoles =
				updatedNode.hybridRoles.network || updatedNode.hybridRoles.compute || updatedNode.hybridRoles.storage;
			if (updatedNode.hybridRoles.controller && !hasOtherRoles) {
				delete updatedNode.tunnelNic;
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

					{/* Management NIC */}
					<div className="mb-4">
						<h4 className="text-md font-medium text-gray-700 mb-2">Management Network Interface</h4>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
							<div>
								<input
									type="text"
									value={node.managementNic.name}
									onChange={(e) => updateNicField(node.id, "managementNic", "name", e.target.value)}
									className={`input-field ${
										isInterfaceNameDuplicate(node, "management", node.managementNic.name)
											? "border-red-500 bg-red-50"
											: ""
									}`}
									placeholder="NIC name (e.g., ens3)"
								/>
								{isInterfaceNameDuplicate(node, "management", node.managementNic.name) && (
									<p className="text-xs text-red-600 mt-1">
										Interface name already used on this node
									</p>
								)}
							</div>
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
					{canHaveTunnelInterface(node) && (
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
										disabled={
											node.type === "compute" ||
											node.type === "network" ||
											node.type === "storage" ||
											(node.type === "hybrid" &&
												node.hybridRoles &&
												(node.hybridRoles.network ||
													node.hybridRoles.compute ||
													node.hybridRoles.storage))
										}
										className={`text-sm ${
											node.type === "compute" ||
											node.type === "network" ||
											node.type === "storage" ||
											(node.type === "hybrid" &&
												node.hybridRoles &&
												(node.hybridRoles.network ||
													node.hybridRoles.compute ||
													node.hybridRoles.storage))
												? "text-gray-400 cursor-not-allowed"
												: "text-red-500 hover:text-red-700"
										}`}
									>
										Remove
									</button>
								)}
							</div>
							{node.tunnelNic && (
								<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
									<div>
										<input
											type="text"
											value={node.tunnelNic.name}
											onChange={(e) =>
												updateNicField(node.id, "tunnelNic", "name", e.target.value)
											}
											className={`input-field ${
												isInterfaceNameDuplicate(node, "tunnel", node.tunnelNic.name)
													? "border-red-500 bg-red-50"
													: ""
											}`}
											placeholder="NIC name (e.g., ens4)"
										/>
										{isInterfaceNameDuplicate(node, "tunnel", node.tunnelNic.name) && (
											<p className="text-xs text-red-600 mt-1">
												Interface name already used on this node
											</p>
										)}
									</div>
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
					)}

					{/* External NIC - Only for network nodes or hybrid with network role */}
					{canHaveExternalInterface(node) && (
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
									<div>
										<input
											type="text"
											value={node.externalNic.name}
											onChange={(e) =>
												updateNicField(node.id, "externalNic", "name", e.target.value)
											}
											className={`input-field ${
												isInterfaceNameDuplicate(node, "external", node.externalNic.name)
													? "border-red-500 bg-red-50"
													: ""
											}`}
											placeholder="NIC name (e.g., ens5)"
										/>
										{isInterfaceNameDuplicate(node, "external", node.externalNic.name) && (
											<p className="text-xs text-red-600 mt-1">
												Interface name already used on this node
											</p>
										)}
									</div>
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
					)}

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
									<div>
										<input
											type="text"
											value={node.vipExternalNic.name}
											onChange={(e) =>
												updateNicField(node.id, "vipExternalNic", "name", e.target.value)
											}
											className={`input-field ${
												isInterfaceNameDuplicate(node, "vipExternal", node.vipExternalNic.name)
													? "border-red-500 bg-red-50"
													: ""
											}`}
											placeholder="NIC name (e.g., ens5)"
										/>
										{isInterfaceNameDuplicate(node, "vipExternal", node.vipExternalNic.name) && (
											<p className="text-xs text-red-600 mt-1">
												Interface name already used on this node
											</p>
										)}
									</div>
									<input
										type="text"
										value={node.vipExternalNic.ip}
										onChange={(e) =>
											updateNicField(node.id, "vipExternalNic", "ip", e.target.value)
										}
										className="input-field"
										placeholder="Leave empty - configured via network settings"
										disabled
									/>
								</div>
							)}
							{node.vipExternalNic && node.vipExternalNic.ip && (
								<div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
									<p className="text-sm text-yellow-800">
										<strong>Warning:</strong> VIP external interface should not have a static IP.
										Configure external VIP via network settings instead.
									</p>
								</div>
							)}
							{node.externalNic &&
								node.vipExternalNic &&
								node.externalNic.name === node.vipExternalNic.name && (
									<div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
										<p className="text-sm text-red-800">
											<strong>Error:</strong> External and VIP external interfaces cannot use the
											same network interface.
										</p>
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

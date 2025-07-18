import type { Node, NetworkConfig, ValidationResult } from "../types/index.js";

/**
 * Get all roles present in the deployment including hybrid node roles
 */
const getAllRoles = (nodes: Node[]): Set<string> => {
	const roles = new Set<string>();

	for (const node of nodes) {
		if (node.type === "hybrid" && node.hybridRoles) {
			// Add enabled hybrid roles
			if (node.hybridRoles.controller) roles.add("controller");
			if (node.hybridRoles.network) roles.add("network");
			if (node.hybridRoles.compute) roles.add("compute");
			if (node.hybridRoles.storage) roles.add("storage");
		} else {
			// Add regular node type as role
			roles.add(node.type);
		}
	}

	return roles;
};

export const isValidCIDR = (cidr: string): boolean => {
	const cidrPattern = /^(\d{1,3}\.){3}\d{1,3}\/([0-9]|[1-2][0-9]|3[0-2])$/;
	return cidrPattern.test(cidr);
};

export const isValidIpAddress = (ip: string): boolean => {
	const ipPattern =
		/^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
	return ipPattern.test(ip);
};

export const checkIpInSubnet = (ipAddress: string, subnet: string): [number, boolean] => {
	if (!isValidIpAddress(ipAddress)) {
		return [-1, false];
	}

	const [subnetIp, subnetMask] = subnet.split("/");
	if (!isValidIpAddress(subnetIp) || isNaN(Number(subnetMask)) || Number(subnetMask) < 0 || Number(subnetMask) > 32) {
		return [-2, false];
	}

	const ipParts = ipAddress.split(".").map(Number);
	const subnetParts = subnetIp.split(".").map(Number);
	const mask = parseInt(subnetMask, 10);

	// Calculate the number of bits for the network portion
	const maskBits = (1 << (32 - mask)) - 1;

	// Convert IPs to integers
	const ipInt = (ipParts[0] << 24) | (ipParts[1] << 16) | (ipParts[2] << 8) | ipParts[3];
	const subnetInt = (subnetParts[0] << 24) | (subnetParts[1] << 16) | (subnetParts[2] << 8) | subnetParts[3];

	// Check if the IP is in the subnet
	if ((ipInt & ~maskBits) === (subnetInt & ~maskBits)) {
		return [ipInt, true];
	} else {
		return [-3, false];
	}
};

export const validateConfiguration = (nodes: Node[], config: NetworkConfig): ValidationResult => {
	const details: string[] = [];
	let isValid = true;

	// Validate network CIDRs
	if (!isValidCIDR(config.managementCidr)) {
		details.push(`${config.managementCidr} is an invalid management CIDR subnet address.`);
		isValid = false;
	} else {
		details.push(`${config.managementCidr} is a valid management CIDR subnet address.`);
	}

	if (!isValidCIDR(config.tunnelCidr)) {
		details.push(`${config.tunnelCidr} is an invalid tunnel CIDR subnet address.`);
		isValid = false;
	} else {
		details.push(`${config.tunnelCidr} is a valid tunnel CIDR subnet address.`);
	}

	if (!isValidCIDR(config.externalCidr)) {
		details.push(`${config.externalCidr} is an invalid external CIDR subnet address.`);
		isValid = false;
	} else {
		details.push(`${config.externalCidr} is a valid external CIDR subnet address.`);
	}

	// Validate node configurations
	const managementIps: number[] = [];
	const tunnelIps: number[] = [];

	for (const node of nodes) {
		if (!node.hostname || !node.managementNic.name) {
			details.push(`Node ${node.hostname || "unnamed"} has missing required fields.`);
			isValid = false;
			continue;
		}

		// Validate that interface names are unique within the node
		const interfaceNames: string[] = [];
		const interfaces = [
			{ type: "Management", nic: node.managementNic },
			{ type: "Tunnel", nic: node.tunnelNic },
			{ type: "External", nic: node.externalNic },
			{ type: "VIP External", nic: node.vipExternalNic },
		].filter((item) => item.nic && item.nic.name && item.nic.name.trim());

		for (const iface of interfaces) {
			const nicName = iface.nic!.name.trim();
			if (interfaceNames.includes(nicName)) {
				details.push(
					`Node ${node.hostname}: Interface name '${nicName}' is used multiple times. Each interface must have a unique name.`
				);
				isValid = false;
			} else {
				interfaceNames.push(nicName);
			}
		}

		// Check management IP
		const [managementIpNum, managementValid] = checkIpInSubnet(node.managementNic.ip, config.managementCidr);
		if (managementValid) {
			if (managementIps.includes(managementIpNum)) {
				details.push(`Duplicate management IP: ${node.managementNic.ip}`);
				isValid = false;
			} else {
				managementIps.push(managementIpNum);
				details.push(`${node.managementNic.ip} is a valid management IP for ${node.hostname}.`);
			}
		} else {
			details.push(`${node.managementNic.ip} is an invalid management IP for ${node.hostname}.`);
			isValid = false;
		}

		// Check tunnel IP if exists
		if (node.tunnelNic?.ip) {
			const [tunnelIpNum, tunnelValid] = checkIpInSubnet(node.tunnelNic.ip, config.tunnelCidr);
			if (tunnelValid) {
				if (tunnelIps.includes(tunnelIpNum)) {
					details.push(`Duplicate tunnel IP: ${node.tunnelNic.ip}`);
					isValid = false;
				} else {
					tunnelIps.push(tunnelIpNum);
					details.push(`${node.tunnelNic.ip} is a valid tunnel IP for ${node.hostname}.`);
				}
			} else {
				details.push(`${node.tunnelNic.ip} is an invalid tunnel IP for ${node.hostname}.`);
				isValid = false;
			}
		}

		// NEW CONSTRAINTS: Interface requirements by node type
		if (node.type === "controller") {
			// Controller nodes cannot have tunnel interface
			if (node.tunnelNic?.ip) {
				details.push(`Controller node ${node.hostname} cannot have a tunnel interface.`);
				isValid = false;
			}
		}

		if (node.type === "compute") {
			// Compute nodes must have tunnel interface
			if (!node.tunnelNic?.ip) {
				details.push(`Compute node ${node.hostname} must have a tunnel interface.`);
				isValid = false;
			}
		}

		// UNIFIED EXTERNAL INTERFACE CONSTRAINT: Only network nodes or hybrid with network role can have external interface
		if (node.externalNic?.ip) {
			const canHaveExternal = node.type === "network" || (node.type === "hybrid" && node.hybridRoles?.network);

			if (!canHaveExternal) {
				details.push(
					`${node.hostname} cannot have an external interface. Only network nodes or hybrid nodes with network role can have external interfaces.`
				);
				isValid = false;
			}
		}

		if (node.type === "network") {
			// Network nodes must have tunnel interface
			if (!node.tunnelNic?.ip) {
				details.push(`Network node ${node.hostname} must have a tunnel interface.`);
				isValid = false;
			}
		}

		// Handle hybrid nodes
		if (node.type === "hybrid" && node.hybridRoles) {
			const hasOtherRoles = node.hybridRoles.network || node.hybridRoles.compute || node.hybridRoles.storage;

			// If hybrid has ONLY controller role, it cannot have tunnel interface
			if (node.hybridRoles.controller && !hasOtherRoles && node.tunnelNic?.ip) {
				details.push(`Hybrid node ${node.hostname} with only controller role cannot have a tunnel interface.`);
				isValid = false;
			}

			// If hybrid has controller AND other roles, it must have tunnel interface for the other roles
			if (node.hybridRoles.controller && hasOtherRoles && !node.tunnelNic?.ip) {
				details.push(
					`Hybrid node ${node.hostname} with controller and other roles must have a tunnel interface for non-controller services.`
				);
				isValid = false;
			}

			// If hybrid has compute role, it must have tunnel interface
			if (node.hybridRoles.compute) {
				if (!node.tunnelNic?.ip) {
					details.push(`Hybrid node ${node.hostname} with compute role must have a tunnel interface.`);
					isValid = false;
				}
			}

			// If hybrid has network role, it must have tunnel interface
			if (node.hybridRoles.network && !node.tunnelNic?.ip) {
				details.push(`Hybrid node ${node.hostname} with network role must have a tunnel interface.`);
				isValid = false;
			}

			// If hybrid has storage role, it must have tunnel interface
			if (node.hybridRoles.storage && !node.tunnelNic?.ip) {
				details.push(`Hybrid node ${node.hostname} with storage role must have a tunnel interface.`);
				isValid = false;
			}
		}

		// Check that external and VIP external interfaces are different
		if (node.externalNic?.name && node.vipExternalNic?.name) {
			if (node.externalNic.name === node.vipExternalNic.name) {
				details.push(
					`Node ${node.hostname}: External interface and VIP external interface cannot be the same.`
				);
				isValid = false;
			}
		}

		// Validate that VIP external interface doesn't have a specific IP (should be configured via network config)
		if (node.vipExternalNic?.ip && node.vipExternalNic.ip.trim() !== "") {
			details.push(
				`Node ${node.hostname}: VIP external interface should not have a specific IP address. Use network configuration instead.`
			);
			isValid = false;
		}
	}

	// Validate external network configuration
	const [, extGatewayValid] = checkIpInSubnet(config.extGatewayIp, config.externalCidr);
	const [extStartNum, extStartValid] = checkIpInSubnet(config.extStartIp, config.externalCidr);
	const [extEndNum, extEndValid] = checkIpInSubnet(config.extEndIp, config.externalCidr);

	if (!extGatewayValid) {
		details.push(`${config.extGatewayIp} is an invalid external gateway IP.`);
		isValid = false;
	} else {
		details.push(`${config.extGatewayIp} is a valid external gateway IP.`);
	}

	if (!extStartValid) {
		details.push(`${config.extStartIp} is an invalid external start IP.`);
		isValid = false;
	} else {
		details.push(`${config.extStartIp} is a valid external start IP.`);
	}

	if (!extEndValid) {
		details.push(`${config.extEndIp} is an invalid external end IP.`);
		isValid = false;
	} else {
		details.push(`${config.extEndIp} is a valid external end IP.`);
	}

	if (extStartValid && extEndValid && extStartNum > extEndNum) {
		details.push("Start IP must be less than or equal to End IP.");
		isValid = false;
	}

	// Check for at least one controller node (including hybrid nodes)
	const presentRoles = getAllRoles(nodes);
	const requiredRoles = ["controller", "network", "compute", "storage"];

	if (!presentRoles.has("controller")) {
		details.push("At least one controller node (or hybrid node with controller role) is required.");
		isValid = false;
	}

	// Check for all required roles in deployment
	const missingRoles = requiredRoles.filter((role) => !presentRoles.has(role));
	if (missingRoles.length > 0) {
		details.push(`Missing required roles in deployment: ${missingRoles.join(", ")}`);
		isValid = false;
	} else {
		details.push("All required roles (controller, network, compute, storage) are present in the deployment.");
	}

	// Validate hybrid nodes have at least one role selected
	for (const node of nodes) {
		if (node.type === "hybrid") {
			const hybridRoles = node.hybridRoles;
			if (
				!hybridRoles ||
				(!hybridRoles.controller && !hybridRoles.network && !hybridRoles.compute && !hybridRoles.storage)
			) {
				details.push(`Hybrid node ${node.hostname} must have at least one role selected.`);
				isValid = false;
			}
		}
	}

	// Check for at least one external interface for floating IP functionality
	const nodesWithExternalInterface = nodes.filter((node) => {
		// Check if node is network type or has network role
		const isNetworkNode = node.type === "network" || (node.type === "hybrid" && node.hybridRoles?.network);
		// And has external interface
		return isNetworkNode && node.externalNic;
	});

	if (nodesWithExternalInterface.length === 0) {
		details.push(
			"At least one network node (or hybrid node with network role) must have an external interface for floating IP functionality."
		);
		isValid = false;
	} else {
		const nodeNames = nodesWithExternalInterface.map((node) => node.hostname).join(", ");
		details.push(`External interface available for floating IPs on: ${nodeNames}`);
	}

	return {
		isValid,
		message: isValid ? "Configuration validation passed!" : "Configuration validation failed!",
		details,
	};
};

import type { Node, NetworkConfig } from "../types/index.js";

/**
 * Extract base IP from CIDR notation
 */
export function getBaseIPFromCIDR(cidr: string): string {
	const [ip] = cidr.split("/");
	const parts = ip.split(".");

	if (cidr.includes("/24")) {
		return `${parts[0]}.${parts[1]}.${parts[2]}`;
	} else if (cidr.includes("/16")) {
		return `${parts[0]}.${parts[1]}`;
	}
	return `${parts[0]}.${parts[1]}.${parts[2]}`;
}

/**
 * Get node type to IP range mapping
 */
export function getNodeTypeRanges() {
	return {
		controller: 10,
		network: 20,
		compute: 30,
		storage: 40,
		hybrid: 50,
	} as const;
}

/**
 * Generate next available IP for a node type
 */
export function generateNextAvailableIP(
	nodeType: Node["type"],
	networkType: "management" | "tunnel",
	networkConfig: NetworkConfig,
	existingNodes: Node[]
): string {
	const baseIP =
		networkType === "management"
			? getBaseIPFromCIDR(networkConfig.managementCidr)
			: getBaseIPFromCIDR(networkConfig.tunnelCidr);

	const ranges = getNodeTypeRanges();
	const startRange = ranges[nodeType];

	const existingIPs = existingNodes
		.filter((n) => n.type === nodeType)
		.map((n) => (networkType === "management" ? n.managementNic.ip : n.tunnelNic?.ip))
		.filter((ip) => ip && ip.startsWith(baseIP));

	// Handle /16 networks differently
	const cidr = networkType === "management" ? networkConfig.managementCidr : networkConfig.tunnelCidr;

	if (cidr.includes("/16") && networkType === "management") {
		// For /16 networks, use the third octet for node type ranges
		const thirdOctet = Math.floor(startRange / 10) + 38;
		for (let i = 1; i <= 9; i++) {
			const newIP = `${baseIP}.${thirdOctet}.${startRange + i}`;
			if (!existingIPs.includes(newIP)) {
				return newIP;
			}
		}
		return `${baseIP}.${thirdOctet}.${startRange + 1}`;
	} else {
		// For /24 networks, use the last octet
		for (let i = 1; i <= 9; i++) {
			const newIP = `${baseIP}.${startRange + i}`;
			if (!existingIPs.includes(newIP)) {
				return newIP;
			}
		}
		return `${baseIP}.${startRange + 1}`;
	}
}

/**
 * Generate next available hostname for a node type
 */
export function generateNextAvailableHostname(nodeType: Node["type"], existingNodes: Node[]): string {
	const existingHostnames = existingNodes
		.filter((n) => n.type === nodeType)
		.map((n) => n.hostname)
		.filter((hostname) => hostname.startsWith(nodeType));

	// Find the next available number
	for (let i = 1; i <= 9; i++) {
		const newHostname = `${nodeType}${i.toString().padStart(2, "0")}`;
		if (!existingHostnames.includes(newHostname)) {
			return newHostname;
		}
	}

	// If all numbers are taken, return the first one
	return `${nodeType}01`;
}

/**
 * Create a new node with auto-assigned properties
 */
export function createNewNode(nodeType: Node["type"], networkConfig: NetworkConfig, existingNodes: Node[]): Node {
	const hostname = generateNextAvailableHostname(nodeType, existingNodes);
	const managementIP = generateNextAvailableIP("hybrid", "management", networkConfig, existingNodes);
	const tunnelIP = generateNextAvailableIP("hybrid", "tunnel", networkConfig, existingNodes);

	return {
		id: Date.now().toString(),
		hostname,
		type: nodeType,
		managementNic: {
			id: `mn${Date.now()}`,
			name: "ens3",
			ip: managementIP,
		},
		tunnelNic: {
			id: `tn${Date.now()}`,
			name: "ens4",
			ip: tunnelIP,
		},
		...(nodeType === "hybrid" && {
			hybridRoles: {
				controller: true,
				network: false,
				compute: false,
				storage: false,
			},
		}),
	};
}

/**
 * Generate next available node ID
 */
export function generateNextNodeId(existingNodes: Node[]): string {
	const maxId = Math.max(...existingNodes.map((n) => parseInt(n.id, 10)), 0);
	return (maxId + 1).toString();
}

/**
 * Generate a default node with auto-assigned properties
 */
export function generateDefaultNode(id: string, existingNodes: Node[], networkConfig: NetworkConfig): Node {
	const nodeType: Node["type"] = "hybrid"; // Default to hybrid
	const hostname = generateNextAvailableHostname(nodeType, existingNodes);
	const managementIP = generateNextAvailableIP(nodeType, "management", networkConfig, existingNodes);
	const tunnelIP = generateNextAvailableIP(nodeType, "tunnel", networkConfig, existingNodes);

	return {
		id,
		hostname,
		type: nodeType,
		managementNic: {
			id: `mn${id}`,
			name: "ens3",
			ip: managementIP,
		},
		tunnelNic: {
			id: `tn${id}`,
			name: "ens4",
			ip: tunnelIP,
		},
		storageDisks: [],
		hybridRoles: {
			controller: false,
			network: false,
			compute: true,
			storage: false,
		},
	};
}

import type { Node, NetworkConfig, HybridRoles } from "../types/index.js";

export interface NodeSpecification {
	name: string;
	cpuCores: number;
	ram: string;
	storage: string[];
	networkInterfaces: number;
	description?: string;
}

export interface SystemSpecification {
	nodes: NodeSpecification[];
	totalCpuCores: number;
	totalRam: number;
	totalStorage: number;
	networkRequirements: string[];
	recommendations: string[];
}

export class SpecificationService {
	/**
	 * Generate hardware specifications and recommendations based on node configuration
	 */
	static generateSystemSpecification(nodes: Node[], networkConfig: NetworkConfig): SystemSpecification {
		const nodeSpecs = this.generateNodeSpecifications(nodes);
		const totals = this.calculateTotals(nodeSpecs);
		const networkReqs = this.generateNetworkRequirements(nodes, networkConfig);
		const recommendations = this.generateRecommendations(nodes, networkConfig);

		return {
			nodes: nodeSpecs,
			totalCpuCores: totals.cpu,
			totalRam: totals.ram,
			totalStorage: totals.storage,
			networkRequirements: networkReqs,
			recommendations,
		};
	}

	/**
	 * Generate specifications for individual nodes based on their roles
	 */
	private static generateNodeSpecifications(nodes: Node[]): NodeSpecification[] {
		return nodes.map((node) => {
			const spec = this.getBaseSpecForNodeType(node.type);

			// Adjust for hybrid nodes
			if (node.type === "hybrid" && node.hybridRoles) {
				spec.cpuCores = this.calculateHybridCpuCores(node.hybridRoles);
				spec.ram = this.calculateHybridRam(node.hybridRoles);
				spec.storage = this.calculateHybridStorage(node.hybridRoles);
				spec.description = `Hybrid node: ${Object.entries(node.hybridRoles)
					.filter(([, enabled]) => enabled)
					.map(([role]) => role)
					.join(", ")}`;
			}

			// Adjust storage based on actual storage disks configured
			if (node.storageDisks && node.storageDisks.length > 0) {
				const storageDisks = node.storageDisks.map((disk) => `80GB (${disk.volumeGroup})`);
				if (spec.storage.length > 1) {
					spec.storage = [spec.storage[0], ...storageDisks];
				} else {
					spec.storage.push(...storageDisks);
				}
			}

			// Count actual network interfaces based on node configuration
			let nicCount = 1; // Management NIC (always present)
			if (node.tunnelNic) nicCount++;
			if (node.externalNic) nicCount++;
			if (node.vipExternalNic) nicCount++;
			spec.networkInterfaces = nicCount;

			// Add interface details to description
			const interfaces = ["Management"];
			if (node.tunnelNic) interfaces.push("Tunnel");
			if (node.externalNic) interfaces.push("External");
			if (node.vipExternalNic) interfaces.push("VIP External");

			const interfaceDetails = `${nicCount} NICs: ${interfaces.join(", ")}`;
			if (spec.description) {
				spec.description = `${spec.description} - ${interfaceDetails}`;
			} else {
				spec.description = interfaceDetails;
			}

			return {
				...spec,
				name: node.hostname,
			};
		});
	}

	/**
	 * Get base specifications for each node type
	 */
	private static getBaseSpecForNodeType(nodeType: string): Omit<NodeSpecification, "name"> {
		switch (nodeType) {
			case "controller":
				return {
					cpuCores: 6,
					ram: "16GB",
					storage: ["80GB (OS)"],
					networkInterfaces: 2, // Management + External (no tunnel allowed)
					description: "Controller node - manages OpenStack services, no tunnel interface",
				};
			case "network":
				return {
					cpuCores: 4,
					ram: "10GB",
					storage: ["80GB (OS)"],
					networkInterfaces: 3, // Management + Tunnel + External
					description: "Network node - handles Neutron networking, requires tunnel interface",
				};
			case "compute":
				return {
					cpuCores: 6,
					ram: "16GB",
					storage: ["100GB (OS)", "80GB (Cinder storage)"],
					networkInterfaces: 2, // Management + Tunnel (no external allowed)
					description: "Compute node - hosts VMs, requires tunnel interface, no external interface",
				};
			case "storage":
				return {
					cpuCores: 4,
					ram: "8GB",
					storage: ["80GB (OS)", "200GB+ (Block storage)"],
					networkInterfaces: 2, // Management + Tunnel
					description: "Storage node - provides Cinder volumes, requires tunnel interface",
				};
			case "hybrid":
				return {
					cpuCores: 8,
					ram: "24GB",
					storage: ["120GB (OS)", "100GB (Storage)"],
					networkInterfaces: 3, // Variable based on roles
					description: "Multi-role node - interface requirements vary by selected roles",
				};
			default:
				return {
					cpuCores: 4,
					ram: "8GB",
					storage: ["80GB (OS)"],
					networkInterfaces: 2,
					description: "Generic OpenStack node",
				};
		}
	}

	/**
	 * Calculate CPU cores needed for hybrid nodes
	 */
	private static calculateHybridCpuCores(roles: HybridRoles): number {
		let cores = 2; // Base
		if (roles.controller) cores += 4;
		if (roles.network) cores += 2;
		if (roles.compute) cores += 4;
		if (roles.storage) cores += 2;
		return cores;
	}

	/**
	 * Calculate RAM needed for hybrid nodes
	 */
	private static calculateHybridRam(roles: HybridRoles): string {
		let ramGB = 4; // Base
		if (roles.controller) ramGB += 12;
		if (roles.network) ramGB += 6;
		if (roles.compute) ramGB += 12;
		if (roles.storage) ramGB += 4;
		return `${ramGB}GB`;
	}

	/**
	 * Calculate storage needed for hybrid nodes
	 */
	private static calculateHybridStorage(roles: HybridRoles): string[] {
		const storage = ["100GB (OS)"];

		if (roles.compute || roles.storage) {
			storage.push("80GB (Cinder storage)");
		}

		return storage;
	}

	/**
	 * Calculate total resource requirements
	 */
	private static calculateTotals(nodeSpecs: NodeSpecification[]): { cpu: number; ram: number; storage: number } {
		const totals = nodeSpecs.reduce(
			(acc, spec) => {
				acc.cpu += spec.cpuCores;
				acc.ram += parseInt(spec.ram.replace(/[^\d]/g, ""));

				// Calculate total storage (just primary OS disk for total)
				const primaryStorage = parseInt(spec.storage[0].replace(/[^\d]/g, ""));
				acc.storage += primaryStorage;

				return acc;
			},
			{ cpu: 0, ram: 0, storage: 0 }
		);

		return totals;
	}

	/**
	 * Generate network requirements based on configuration
	 */
	private static generateNetworkRequirements(nodes: Node[], networkConfig: NetworkConfig): string[] {
		const requirements = [
			`Management Network: ${networkConfig.managementCidr}`,
			`Internal VIP Address: ${networkConfig.kollaIntVipAddr}`,
		];

		if (networkConfig.tunnelCidr) {
			requirements.push(`Tunnel Network: ${networkConfig.tunnelCidr}`);
		}

		if (networkConfig.externalCidr) {
			requirements.push(`External Network: ${networkConfig.externalCidr}`);
			requirements.push(`External IP Range: ${networkConfig.extStartIp} - ${networkConfig.extEndIp}`);
			requirements.push(`External Gateway: ${networkConfig.extGatewayIp}`);
		}

		if (networkConfig.vipExternalIp) {
			requirements.push(`External VIP: ${networkConfig.vipExternalIp}`);
		}

		// Count required NICs
		const hasNetworkNode = nodes.some(
			(node) => node.type === "network" || (node.type === "hybrid" && node.hybridRoles?.network)
		);
		const requiredNics = hasNetworkNode ? "2-3" : "2";
		requirements.push(`Required NICs per node: ${requiredNics}`);

		return requirements;
	}

	/**
	 * Generate deployment recommendations
	 */
	private static generateRecommendations(nodes: Node[], networkConfig: NetworkConfig): string[] {
		const recommendations = [
			"Use Debian 12 (Bookworm) with latest kernel for Kolla-Ansible 2025.1 compatibility",
			"Ensure all hosts have synchronized time (chrony/NTP service)",
			"Configure SSH key-based authentication between all nodes",
			"Use dedicated physical networks for management and tunnel traffic when possible",
			"Allocate at least 20% extra disk space beyond minimum requirements",
			"Enable container runtime (Docker) on all nodes before deployment",
			"⚠️  Interface Constraints: Controller nodes cannot have tunnel interfaces (unless hybrid with other roles)",
			"⚠️  Interface Constraints: Compute nodes cannot have external interfaces",
			"⚠️  Interface Constraints: Network/Compute/Storage nodes require tunnel interfaces",
			"⚠️  Interface Constraints: Hybrid nodes with controller + other roles require tunnel interfaces",
		];

		// Node-specific recommendations
		const controllerNodes = nodes.filter(
			(n) => n.type === "controller" || (n.type === "hybrid" && n.hybridRoles?.controller)
		);
		const computeNodes = nodes.filter(
			(n) => n.type === "compute" || (n.type === "hybrid" && n.hybridRoles?.compute)
		);
		const networkNodes = nodes.filter(
			(n) => n.type === "network" || (n.type === "hybrid" && n.hybridRoles?.network)
		);

		if (controllerNodes.length === 1) {
			recommendations.push("⚠️  Single controller setup: Consider HA setup for production environments");
		}

		if (computeNodes.length > 5) {
			recommendations.push("💡 Large deployment: Consider using dedicated network nodes for better performance");
		}

		if (networkNodes.length === 0) {
			recommendations.push("📝 No dedicated network node: Network services will run on controller/hybrid nodes");
		}

		// Storage recommendations
		const nodesWithStorage = nodes.filter(
			(n) =>
				n.type === "storage" ||
				n.type === "compute" ||
				(n.type === "hybrid" && (n.hybridRoles?.storage || n.hybridRoles?.compute))
		);

		if (nodesWithStorage.length > 0) {
			recommendations.push("🗄️  Storage: Use SSD for OS disks and HDD/SSD for Cinder volumes");
			recommendations.push("🔧 LVM: Ensure storage disks are not partitioned before creating LVM volumes");
		}

		// Network recommendations
		if (!networkConfig.tunnelCidr) {
			recommendations.push("🌐 Network: Consider configuring a dedicated tunnel network for better isolation");
		}

		if (!networkConfig.externalCidr) {
			recommendations.push("🔗 External Network: Configure external network for floating IP access");
		}

		// Constraint-specific recommendations
		const invalidNodes = [];
		for (const node of nodes) {
			// Check for constraint violations
			if (node.type === "controller" && node.tunnelNic) {
				invalidNodes.push(`${node.hostname} (controller with tunnel interface)`);
			}
			if (
				(node.type === "compute" || (node.type === "hybrid" && node.hybridRoles?.compute)) &&
				node.externalNic
			) {
				invalidNodes.push(`${node.hostname} (compute with external interface)`);
			}
			if ((node.type === "network" || node.type === "compute" || node.type === "storage") && !node.tunnelNic) {
				invalidNodes.push(`${node.hostname} (${node.type} without tunnel interface)`);
			}
			if (node.type === "hybrid" && node.hybridRoles) {
				const hasOtherRoles = node.hybridRoles.network || node.hybridRoles.compute || node.hybridRoles.storage;
				
				// If hybrid has ONLY controller role, it cannot have tunnel interface
				if (node.hybridRoles.controller && !hasOtherRoles && node.tunnelNic) {
					invalidNodes.push(`${node.hostname} (hybrid with only controller role has tunnel interface)`);
				}
				
				// If hybrid has controller AND other roles, it must have tunnel interface
				if (node.hybridRoles.controller && hasOtherRoles && !node.tunnelNic) {
					invalidNodes.push(`${node.hostname} (hybrid with controller and other roles missing tunnel interface)`);
				}
				
				// If hybrid has other roles (non-controller), it must have tunnel interface
				if (hasOtherRoles && !node.tunnelNic) {
					invalidNodes.push(`${node.hostname} (hybrid with roles requiring tunnel interface)`);
				}
			}
		}

		if (invalidNodes.length > 0) {
			recommendations.push(
				`❌ Configuration Issues: Fix these constraint violations: ${invalidNodes.join(", ")}`
			);
		}

		// Performance recommendations
		const totalCpuCores = nodes.reduce((sum, node) => {
			const spec = this.getBaseSpecForNodeType(node.type);
			return sum + spec.cpuCores;
		}, 0);

		if (totalCpuCores < 16) {
			recommendations.push("⚡ Performance: Consider increasing CPU cores for better performance");
		}

		return recommendations;
	}
}

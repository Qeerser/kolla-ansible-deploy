export interface NetworkInterface {
	id: string;
	name: string;
	ip: string;
}

export interface StorageDisk {
	id: string;
	name: string; // e.g., /dev/sdb, /dev/sdc
	volumeGroup: string; // e.g., cinder-volumes
}

export interface HybridRoles {
	controller: boolean;
	network: boolean;
	compute: boolean;
	storage: boolean;
}

export interface Node {
	id: string;
	hostname: string;
	type: "controller" | "network" | "compute" | "storage" | "hybrid";
	hybridRoles?: HybridRoles; // For hybrid nodes only
	managementNic: NetworkInterface;
	tunnelNic?: NetworkInterface;
	externalNic?: NetworkInterface;
	vipExternalNic?: NetworkInterface; // For controller external VIP
	storageDisks?: StorageDisk[]; // For storage nodes
}

export interface NetworkConfig {
	managementCidr: string;
	tunnelCidr: string;
	externalCidr: string;
	kollaUser: string;
	kollaIntVipAddr: string;
	extGatewayIp: string;
	extStartIp: string;
	extEndIp: string;
	vipExternalIp?: string; // VIP for external access
}

export interface ValidationResult {
	isValid: boolean;
	message: string;
	details?: string[];
}

export interface NodeCommands {
	nodeId: string;
	hostname: string;
	nodeType: string;
	commands: string[];
}

export interface TutorialStep {
	id: number;
	title: string;
	description: string;
	commands?: string[];
	nodeCommands?: NodeCommands[];
}

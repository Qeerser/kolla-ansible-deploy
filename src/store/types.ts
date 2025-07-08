import type { Node, NetworkConfig, ValidationResult } from "../types/index.js";

// State interface
export interface AppState {
	nodes: Node[];
	networkConfig: NetworkConfig;
	validation: ValidationResult;
	activeTab: "nodes" | "network" | "specifications" | "visualization" | "tutorial" | "help";
}

// Action types
export type AppAction =
	| { type: "SET_NODES"; payload: Node[] }
	| { type: "ADD_NODE"; payload: Node }
	| { type: "UPDATE_NODE"; payload: { id: string; node: Node } }
	| { type: "REMOVE_NODE"; payload: string }
	| { type: "SET_NETWORK_CONFIG"; payload: NetworkConfig }
	| { type: "SET_VALIDATION"; payload: ValidationResult }
	| { type: "SET_ACTIVE_TAB"; payload: AppState["activeTab"] };

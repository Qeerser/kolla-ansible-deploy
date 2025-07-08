import { useAppContext } from "../store/hooks.js";

export function useAppStore() {
	return useAppContext();
}

export function useNodes() {
	const { state, dispatch } = useAppContext();

	return {
		nodes: state.nodes,
		addNode: (node: import("../types/index.js").Node) => dispatch({ type: "ADD_NODE", payload: node }),
		updateNode: (id: string, node: import("../types/index.js").Node) =>
			dispatch({ type: "UPDATE_NODE", payload: { id, node } }),
		removeNode: (id: string) => dispatch({ type: "REMOVE_NODE", payload: id }),
	};
}

export function useNetworkConfig() {
	const { state, dispatch } = useAppContext();

	return {
		networkConfig: state.networkConfig,
		setNetworkConfig: (config: import("../types/index.js").NetworkConfig) =>
			dispatch({ type: "SET_NETWORK_CONFIG", payload: config }),
	};
}

export function useValidation() {
	const { state, dispatch } = useAppContext();

	return {
		validation: state.validation,
		setValidation: (validation: import("../types/index.js").ValidationResult) =>
			dispatch({ type: "SET_VALIDATION", payload: validation }),
	};
}

export function useActiveTab() {
	const { state, dispatch } = useAppContext();

	return {
		activeTab: state.activeTab,
		setActiveTab: (tab: "nodes" | "network" | "specifications" | "visualization" | "tutorial" | "help") =>
			dispatch({ type: "SET_ACTIVE_TAB", payload: tab }),
	};
}

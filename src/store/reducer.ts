import type { AppState, AppAction } from "./types.js";

// Initial state
export const initialState: AppState = {
	nodes: [
		{
			id: "1",
			hostname: "hybrid01",
			type: "hybrid",
			managementNic: { id: "mn1", name: "ens3", ip: "172.16.38.51" },
			tunnelNic: { id: "tn1", name: "ens4", ip: "10.77.0.51" },
			externalNic: { id: "en1", name: "ens5", ip: "" },
			vipExternalNic: { id: "vip1", name: "ens5", ip: "10.90.38.254" },
			storageDisks: [{ id: "sd1", name: "/dev/sdb", volumeGroup: "cinder-volumes" }],
			hybridRoles: {
				controller: true,
				network: true,
				compute: false,
				storage: true,
			},
		},
		{
			id: "2",
			hostname: "hybrid02",
			type: "hybrid",
			managementNic: { id: "mn2", name: "ens3", ip: "172.16.38.52" },
			tunnelNic: { id: "tn2", name: "ens4", ip: "10.77.0.52" },
			storageDisks: [{ id: "sd2", name: "/dev/sdb", volumeGroup: "cinder-volumes" }],
			hybridRoles: {
				controller: false,
				network: false,
				compute: true,
				storage: true,
			},
		},
	],
	networkConfig: {
		managementCidr: "172.16.0.0/16",
		tunnelCidr: "10.77.0.0/24",
		externalCidr: "10.90.38.0/24",
		kollaUser: "openstack",
		kollaIntVipAddr: "172.16.38.254",
		extGatewayIp: "10.90.38.1",
		extStartIp: "10.90.38.50",
		extEndIp: "10.90.38.200",
		vipExternalIp: "10.90.38.254",
	},
	validation: {
		isValid: false,
		message: "",
		details: [],
	},
	activeTab: "nodes",
};

// Reducer
export function appReducer(state: AppState, action: AppAction): AppState {
	switch (action.type) {
		case "SET_NODES":
			return { ...state, nodes: action.payload };
		case "ADD_NODE":
			return { ...state, nodes: [...state.nodes, action.payload] };
		case "UPDATE_NODE":
			return {
				...state,
				nodes: state.nodes.map((node) => (node.id === action.payload.id ? action.payload.node : node)),
			};
		case "REMOVE_NODE":
			return {
				...state,
				nodes: state.nodes.filter((node) => node.id !== action.payload),
			};
		case "SET_NETWORK_CONFIG":
			return { ...state, networkConfig: action.payload };
		case "SET_VALIDATION":
			return { ...state, validation: action.payload };
		case "SET_ACTIVE_TAB":
			return { ...state, activeTab: action.payload };
		default:
			return state;
	}
}

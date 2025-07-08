import type { AppState, AppAction } from "./types.js";

// Initial state
export const initialState: AppState = {
	nodes: [
		{
			id: "1",
			hostname: "controller01",
			type: "controller",
			managementNic: { id: "mn1", name: "ens3", ip: "172.16.100.11" },
			vipExternalNic: { id: "vip1", name: "ens5", ip: "" },
		},
		{
			id: "2",
			hostname: "network01",
			type: "network",
            externalNic: { id: "en1", name: "ens5", ip: "" },
			managementNic: { id: "mn2", name: "ens3", ip: "172.16.100.21" },
			tunnelNic: { id: "tn2", name: "ens4", ip: "192.168.100.21" },
		},
        		{
			id: "3",
			hostname: "compute01",
			type: "compute",
			managementNic: { id: "mn3", name: "ens3", ip: "172.16.100.31" },
			tunnelNic: { id: "tn3", name: "ens4", ip: "192.168.100.31" }
		},
        		{
			id: "4",
			hostname: "storage01",
			type: "storage",
			managementNic: { id: "mn4", name: "ens3", ip: "172.16.100.41" },
			tunnelNic: { id: "tn4", name: "ens4", ip: "192.168.100.41" },
			storageDisks: [{ id: "sd1", name: "/dev/sdb", volumeGroup: "cinder-volumes" }]
		},
	],
	networkConfig: {
		managementCidr: "172.16.100.0/24",
		tunnelCidr: "192.168.100.0/24",
		externalCidr: "10.100.0.0/24",
		kollaUser: "openstack",
		kollaIntVipAddr: "172.16.100.254",
		extGatewayIp: "10.100.0.1",
		extStartIp: "10.100.0.50",
		extEndIp: "10.100.0.200",
		vipExternalIp: "10.100.0.254",
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

// Test script to validate the hybrid node functionality
import { getAllRoles } from "./src/utils/validation.js";

// Test data
const testNodes = [
	{
		id: "1",
		type: "hybrid",
		hostname: "node1",
		hybridRoles: {
			controller: true,
			network: false,
			compute: true,
			storage: false,
		},
	},
	{
		id: "2",
		type: "storage",
		hostname: "node2",
	},
	{
		id: "3",
		type: "hybrid",
		hostname: "node3",
		hybridRoles: {
			controller: false,
			network: true,
			compute: false,
			storage: true,
		},
	},
];

// Test the getAllRoles function
console.log("Testing getAllRoles function:");
console.log("Present roles:", Array.from(getAllRoles(testNodes)));
console.log("Expected: controller, compute, storage, network");

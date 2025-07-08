# Dynamic IP Assignment Using Network Configuration CIDR

## Overview

Updated the auto IP assignment system to dynamically use the network configuration CIDR ranges instead of hardcoded IP addresses. This makes the system more flexible and allows users to customize their network ranges.

## Changes Made

### 1. Helper Function for CIDR Parsing

Added `getBaseIPFromCIDR(cidr: string)` function that:

-   Extracts the base IP address from CIDR notation
-   Handles both /16 and /24 network ranges
-   Returns appropriate base IP for IP assignment

### 2. Updated IP Assignment Logic

Modified `getNextAvailableIP()` function to:

-   Accept network type parameter ("management" or "tunnel")
-   Use network configuration CIDR ranges dynamically
-   Handle /16 networks by using third octet for node type ranges
-   Handle /24 networks by using last octet for node type ranges

### 3. Network Type Support

-   **Management Network**: Uses `networkConfig.managementCidr`
-   **Tunnel Network**: Uses `networkConfig.tunnelCidr`

### 4. IP Range Allocation

#### For /16 Networks (e.g., 172.16.0.0/16)

-   **Controller**: 172.16.38.11-19
-   **Network**: 172.16.39.21-29
-   **Compute**: 172.16.40.31-39
-   **Storage**: 172.16.41.41-49
-   **Hybrid**: 172.16.42.51-59

#### For /24 Networks (e.g., 10.77.0.0/24)

-   **Controller**: 10.77.0.11-19
-   **Network**: 10.77.0.21-29
-   **Compute**: 10.77.0.31-39
-   **Storage**: 10.77.0.41-49
-   **Hybrid**: 10.77.0.51-59

## Updated Components

### KollaHelper.tsx

-   Added `getBaseIPFromCIDR()` helper function
-   Updated `getNextAvailableIP()` to use network config
-   Modified `addNode()` to assign both management and tunnel IPs
-   Passes `networkConfig` to NodeManager component

### NodeManager.tsx

-   Added `networkConfig` prop to component interface
-   Updated IP assignment functions to use dynamic CIDR ranges
-   Modified node type change logic to use network config
-   Updated tunnel NIC creation to use dynamic IP assignment

## Benefits

1. **Flexibility**: Users can change network ranges in config and IP assignment adapts automatically
2. **Consistency**: All IP assignments use the same CIDR-based logic
3. **Scalability**: Supports both /16 and /24 network configurations
4. **Validation**: IP assignments respect the configured network boundaries
5. **Real-time Updates**: Changes to network config immediately affect new node assignments

## Usage Example

```typescript
// Network Config
networkConfig = {
	managementCidr: "192.168.1.0/24",
	tunnelCidr: "10.0.0.0/24",
	// ... other config
};

// Auto-assigned IPs will use:
// Management: 192.168.1.11-59 (based on node type)
// Tunnel: 10.0.0.11-59 (based on node type)
```

This implementation ensures that the IP assignment system is truly dynamic and respects the user's network configuration preferences.

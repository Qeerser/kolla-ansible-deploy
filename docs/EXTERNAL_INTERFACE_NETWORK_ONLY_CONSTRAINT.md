# External Interface Network-Only Constraint

## Overview

This document describes the implementation of the constraint that restricts external network interfaces to network nodes only. This constraint ensures that only nodes capable of handling external networking (network nodes or hybrid nodes with network role) can have external interfaces.

## Implementation Details

### 1. Constraint Rules

**Who can have external interfaces:**

-   ✅ Network nodes (`node.type === "network"`)
-   ✅ Hybrid nodes with network role (`node.type === "hybrid" && node.hybridRoles.network === true`)

**Who cannot have external interfaces:**

-   ❌ Controller nodes (`node.type === "controller"`)
-   ❌ Compute nodes (`node.type === "compute"`)
-   ❌ Storage nodes (`node.type === "storage"`)
-   ❌ Hybrid nodes without network role (`node.type === "hybrid" && node.hybridRoles.network === false`)

### 2. Validation Logic (src/utils/validation.ts)

Added validation checks for each node type:

```typescript
// Controller nodes cannot have external interface
if (node.type === "controller" && node.externalNic?.ip) {
	details.push(
		`Controller node ${node.hostname} cannot have an external interface. Only network nodes can have external interfaces.`
	);
	isValid = false;
}

// Storage nodes cannot have external interface
if (node.type === "storage" && node.externalNic?.ip) {
	details.push(`Storage node ${node.hostname} cannot have an external interface.`);
	isValid = false;
}

// Hybrid nodes can only have external interface if they have network role
if (node.type === "hybrid" && node.externalNic?.ip && node.hybridRoles && !node.hybridRoles.network) {
	details.push(`Hybrid node ${node.hostname} can only have an external interface if it has the network role.`);
	isValid = false;
}
```

### 3. UI Changes (src/components/NodeManager.tsx)

#### Helper Function

Added `canHaveExternalInterface()` function to determine interface availability:

```typescript
const canHaveExternalInterface = (node: Node): boolean => {
	if (node.type === "network") return true;
	if (node.type === "hybrid" && node.hybridRoles?.network) return true;
	return false;
};
```

#### Interface Visibility

-   **Hidden completely** for nodes that cannot have external interfaces
-   **Visible with full functionality** for nodes that can have external interfaces
-   **No disabled buttons** - interfaces are completely hidden instead

#### Automatic Cleanup

-   **Node type switching**: External interfaces automatically removed when switching to non-network node types
-   **Hybrid role changes**: External interfaces removed when network role is disabled
-   **Immediate enforcement**: Changes take effect immediately in the UI

### 4. Error Reporting (src/services/SpecificationService.ts)

Enhanced constraint violation reporting:

```typescript
// New constraint checks
if (node.type === "controller" && node.externalNic) {
	invalidNodes.push(`${node.hostname} (controller with external interface - only network nodes allowed)`);
}
if (node.type === "storage" && node.externalNic) {
	invalidNodes.push(`${node.hostname} (storage with external interface - only network nodes allowed)`);
}
if (node.type === "hybrid" && node.externalNic && node.hybridRoles && !node.hybridRoles.network) {
	invalidNodes.push(`${node.hostname} (hybrid with external interface but no network role)`);
}
```

Added to recommendations:

```typescript
"⚠️  Interface Constraints: Only network nodes (or hybrid with network role) can have external interfaces";
```

### 5. Documentation Updates (src/components/HelpPage.tsx)

#### Node Type Documentation

-   **Controller**: Updated to specify "Cannot have: External NIC (only network nodes can)"
-   **Network**: Added note "Only network nodes can have external interfaces"

#### Interface Constraints Section

Added new "External Interface Restriction" section:

-   Clear explanation of who can/cannot have external interfaces
-   Reason for the restriction (floating IP and external network access)
-   Visual distinction with orange color scheme

### 6. Behavioral Changes

#### Before Implementation

-   All node types could add external interfaces
-   Disabled buttons for some node types
-   Confusing UI with grayed-out options

#### After Implementation

-   External interface section only visible for network nodes and hybrid with network role
-   Clean UI without disabled/grayed-out elements
-   Automatic cleanup when node types or roles change
-   Clear validation messages for violations

## Technical Implementation

### Validation Flow

1. **Real-time UI**: External interface section hidden for nodes that cannot have it
2. **Role changes**: External interfaces automatically removed when network role disabled
3. **Node type changes**: External interfaces removed when switching to non-network types
4. **Backend validation**: Final check prevents deployment with invalid configurations
5. **Error reporting**: Clear violation messages in recommendations

### UI/UX Improvements

-   **Cleaner interface**: No disabled buttons or grayed-out sections
-   **Immediate feedback**: Changes take effect instantly
-   **Automatic cleanup**: No manual intervention required
-   **Clear constraints**: Visual indicators show what's allowed

## Benefits

1. **Simplified UI**: Removes confusing disabled elements
2. **Automatic enforcement**: Constraints enforced without user action
3. **Clear guidance**: Users understand what interfaces are available
4. **Deployment safety**: Prevents invalid OpenStack configurations
5. **Logical separation**: Aligns with OpenStack networking architecture

## Testing

The constraint has been verified with:

-   ✅ Build verification: `npm run build` passes
-   ✅ Linting verification: `npm run lint` passes
-   ✅ UI behavior: External interfaces only shown for network nodes
-   ✅ Automatic cleanup: Interfaces removed when roles/types change
-   ✅ Validation integration: Backend validation catches violations

## Future Considerations

-   Could extend to validate external interface functionality requirements
-   Could add automatic external interface assignment for network nodes
-   Could provide suggestions when users try to add external functionality to non-network nodes

# Interface Name Uniqueness Constraint Implementation

## Overview

This document describes the implementation of interface name uniqueness constraints in the Kolla OpenStack Installation Helper. The constraint ensures that each node uses unique interface names for all its network interfaces (management, tunnel, external, VIP external).

## Implementation Details

### 1. Validation Logic (src/utils/validation.ts)

Added validation in the main `validateConfiguration` function to check for duplicate interface names within each node:

```typescript
// Validate that interface names are unique within the node
const interfaceNames: string[] = [];
const interfaces = [
	{ type: "Management", nic: node.managementNic },
	{ type: "Tunnel", nic: node.tunnelNic },
	{ type: "External", nic: node.externalNic },
	{ type: "VIP External", nic: node.vipExternalNic },
].filter((item) => item.nic && item.nic.name && item.nic.name.trim());

for (const iface of interfaces) {
	const nicName = iface.nic!.name.trim();
	if (interfaceNames.includes(nicName)) {
		details.push(
			`Node ${node.hostname}: Interface name '${nicName}' is used multiple times. Each interface must have a unique name.`
		);
		isValid = false;
	} else {
		interfaceNames.push(nicName);
	}
}
```

### 2. UI Validation (src/components/NodeManager.tsx)

Added real-time validation in the NodeManager component with:

-   **Helper function** `isInterfaceNameDuplicate()` to check for duplicates
-   **Visual feedback** with red borders and error messages for duplicate interface names
-   **Validation for all interface types**: management, tunnel, external, and VIP external

#### UI Features:

-   Red border and background (`border-red-500 bg-red-50`) for duplicate interface inputs
-   Error message below duplicate interface fields
-   Real-time validation as users type interface names

### 3. Recommendations & Error Reporting (src/services/SpecificationService.ts)

Enhanced the SpecificationService to include interface name validation:

-   Added constraint to recommendations list: "Interface Constraints: Each node must use unique interface names"
-   Added duplicate interface detection in constraint violation checking
-   Reports duplicate interface names in error messages format: `${hostname} (duplicate interface name '${nicName}')`

### 4. Documentation (src/components/HelpPage.tsx)

Added new "Interface Constraints" section with:

-   **Interface Name Requirements** subsection explaining the uniqueness constraint
-   **Examples** showing invalid vs. valid interface configurations:
    -   ❌ Invalid: Management (ens3), Tunnel (ens3), External (ens4)
    -   ✅ Valid: Management (ens3), Tunnel (ens4), External (ens5)
-   **Floating IP Requirement** subsection explaining the external interface constraint

## Constraint Rules

### Interface Name Uniqueness

-   Each node must use unique interface names across all its network interfaces
-   Applies to: Management NIC, Tunnel NIC, External NIC, VIP External NIC
-   Example violation: Using "ens3" for both management and tunnel interfaces
-   Example compliance: Management (ens3), Tunnel (ens4), External (ens5)

### Error Handling

-   **Validation**: Backend validation prevents configuration deployment with duplicate names
-   **UI Feedback**: Real-time visual indicators show duplicate names as users type
-   **Recommendations**: SpecificationService reports violations in constraint checking
-   **Documentation**: Help page explains the requirement with examples

## Technical Implementation

### Validation Flow

1. **Real-time UI validation**: As users type interface names, check for duplicates within the node
2. **Form validation**: Before submission, validate all interface names for uniqueness
3. **Backend validation**: Final validation in `validateConfiguration()` prevents invalid deployments
4. **Error reporting**: SpecificationService includes duplicate name violations in recommendations

### Code Structure

-   **Validation Logic**: Centralized in `src/utils/validation.ts`
-   **UI Validation**: Helper functions in `src/components/NodeManager.tsx`
-   **Error Reporting**: Enhanced in `src/services/SpecificationService.ts`
-   **Documentation**: User guidance in `src/components/HelpPage.tsx`

## Benefits

1. **Prevents deployment failures**: Interface name conflicts would cause OpenStack deployment issues
2. **User-friendly validation**: Real-time feedback helps users fix issues immediately
3. **Clear documentation**: Users understand why unique interface names are required
4. **Comprehensive checking**: Validation covers all interface types and deployment scenarios

## Testing

The constraint has been tested with:

-   Build verification: `npm run build` passes without errors
-   Linting verification: `npm run lint` passes without warnings
-   Real-time UI validation for all interface types
-   Backend validation integration with existing constraint system

## Future Considerations

-   Could extend to validate interface name format (e.g., ensX pattern)
-   Could add validation for network interface availability on target hosts
-   Could provide auto-suggestion for available interface names

# Hybrid Node Constraint Update - v2.3

## Updated Constraint Logic for Hybrid Nodes

### New Constraint Rules

The hybrid node constraints have been refined to handle the controller role more intelligently:

#### 🔄 **Updated Rule: Hybrid Controller Role**

**Previous Rule:**

-   Hybrid nodes with controller role cannot have tunnel interfaces

**New Rule:**

-   Hybrid nodes with **ONLY** controller role cannot have tunnel interfaces
-   Hybrid nodes with controller role **AND** other roles (network/compute/storage) **MUST** have tunnel interfaces

### Detailed Logic

#### Case 1: Hybrid with Only Controller Role

```
Roles: ✅ Controller
Tunnel Interface: ❌ Not allowed
```

**Reason:** Pure controller functionality doesn't need tunnel networking

#### Case 2: Hybrid with Controller + Other Roles

```
Roles: ✅ Controller + ✅ Network/Compute/Storage
Tunnel Interface: ✅ Required
```

**Reason:** Non-controller services (network, compute, storage) require tunnel networking

#### Case 3: Hybrid without Controller Role

```
Roles: ✅ Network/Compute/Storage (no controller)
Tunnel Interface: ✅ Required
```

**Reason:** All non-controller services require tunnel networking

## Implementation Changes

### 1. Validation Logic (`src/utils/validation.ts`)

```typescript
// Check if hybrid has other roles besides controller
const hasOtherRoles = node.hybridRoles.network || node.hybridRoles.compute || node.hybridRoles.storage;

// If ONLY controller role, cannot have tunnel
if (node.hybridRoles.controller && !hasOtherRoles && node.tunnelNic?.ip) {
	// Validation error
}

// If controller + other roles, must have tunnel
if (node.hybridRoles.controller && hasOtherRoles && !node.tunnelNic?.ip) {
	// Validation error
}
```

### 2. NodeManager Logic (`src/components/NodeManager.tsx`)

#### Role Change Handling:

-   **Controller role enabled**: Only removes tunnel if no other roles present
-   **Other roles enabled**: Automatically adds tunnel interface
-   **Final check**: Removes tunnel only if ONLY controller role is enabled

#### UI Button States:

-   **Add Tunnel**: Disabled only for pure controller nodes (controller only)
-   **Remove Tunnel**: Disabled when any non-controller role is present

#### Warning Messages:

-   **Different messages** for pure controller vs controller+other roles
-   **Additional warning** for hybrid controller+other roles missing tunnel

### 3. SpecificationService Updates (`src/services/SpecificationService.ts`)

#### Enhanced Constraint Detection:

```typescript
// Check for hybrid constraint violations
if (node.hybridRoles.controller && !hasOtherRoles && node.tunnelNic) {
	// Error: Pure controller with tunnel
}
if (node.hybridRoles.controller && hasOtherRoles && !node.tunnelNic) {
	// Error: Controller+others without tunnel
}
```

#### Updated Recommendations:

-   More specific constraint descriptions
-   Hybrid-specific guidance
-   Dynamic error detection and reporting

## User Experience Improvements

### 1. Smart Interface Management

-   **Automatic tunnel assignment** when adding roles that require it
-   **Conditional tunnel removal** only when appropriate
-   **Real-time constraint validation** as roles change

### 2. Clear Visual Feedback

-   **Different error messages** for different constraint violations
-   **Contextual help text** explaining role-specific requirements
-   **Disabled buttons** with appropriate styling and tooltips

### 3. Dynamic Validation

-   **Real-time constraint checking** during role selection
-   **Immediate feedback** on configuration validity
-   **Specific error guidance** for each constraint type

## Examples

### Valid Configurations

#### Example 1: Pure Controller Hybrid

```
Node Type: Hybrid
Roles: Controller ✅
Tunnel Interface: None ✅
Status: Valid ✅
```

#### Example 2: Controller + Network Hybrid

```
Node Type: Hybrid
Roles: Controller ✅, Network ✅
Tunnel Interface: Required ✅
Status: Valid ✅
```

#### Example 3: Controller + Compute + Storage Hybrid

```
Node Type: Hybrid
Roles: Controller ✅, Compute ✅, Storage ✅
Tunnel Interface: Required ✅
Status: Valid ✅
```

### Invalid Configurations

#### Example 1: Pure Controller with Tunnel

```
Node Type: Hybrid
Roles: Controller ✅
Tunnel Interface: Present ❌
Status: Invalid ❌
Error: "Hybrid nodes with only controller role cannot have tunnel interfaces"
```

#### Example 2: Controller + Others without Tunnel

```
Node Type: Hybrid
Roles: Controller ✅, Compute ✅
Tunnel Interface: Missing ❌
Status: Invalid ❌
Error: "Hybrid nodes with controller and other roles must have tunnel interfaces"
```

## Benefits

### 1. More Flexible Deployment Options

-   Supports pure controller hybrid nodes for small deployments
-   Allows controller+service combinations for efficient resource usage
-   Maintains network isolation requirements for service roles

### 2. Better User Guidance

-   Clear distinction between different hybrid configurations
-   Specific error messages for each constraint type
-   Automatic interface management based on role selection

### 3. OpenStack Best Practices

-   Aligns with Kolla-Ansible networking requirements
-   Maintains service isolation where needed
-   Optimizes resource usage for hybrid deployments

## Compatibility

-   **Backward Compatible**: Existing pure node types unchanged
-   **Enhanced Hybrid Support**: Better hybrid node configuration options
-   **Validation Improvements**: More precise constraint checking

---

**Version**: 2.3  
**Date**: July 8, 2025  
**Git Tag**: `v2.3`  
**Compatibility**: OpenStack Kolla-Ansible 2025.1, Debian 12

import React from "react";
import type { NetworkConfig } from "../types/index.js";

interface NetworkConfigFormProps {
	config: NetworkConfig;
	onChange: (config: NetworkConfig) => void;
}

const NetworkConfigForm: React.FC<NetworkConfigFormProps> = ({ config, onChange }) => {
	const updateField = (field: keyof NetworkConfig, value: string) => {
		onChange({ ...config, [field]: value });
	};

	return (
		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
			<div>
				<label className="block text-sm font-medium text-gray-700 mb-1">Management Network CIDR</label>
				<input
					type="text"
					value={config.managementCidr}
					onChange={(e) => updateField("managementCidr", e.target.value)}
					className="input-field"
					placeholder="e.g., 172.16.0.0/16"
				/>
			</div>

			<div>
				<label className="block text-sm font-medium text-gray-700 mb-1">Tunnel Network CIDR</label>
				<input
					type="text"
					value={config.tunnelCidr}
					onChange={(e) => updateField("tunnelCidr", e.target.value)}
					className="input-field"
					placeholder="e.g., 10.77.0.0/24"
				/>
			</div>

			<div>
				<label className="block text-sm font-medium text-gray-700 mb-1">External Network CIDR</label>
				<input
					type="text"
					value={config.externalCidr}
					onChange={(e) => updateField("externalCidr", e.target.value)}
					className="input-field"
					placeholder="e.g., 10.90.38.0/24"
				/>
			</div>

			<div>
				<label className="block text-sm font-medium text-gray-700 mb-1">Kolla User</label>
				<input
					type="text"
					value={config.kollaUser}
					onChange={(e) => updateField("kollaUser", e.target.value)}
					className="input-field"
					placeholder="e.g., openstack"
				/>
			</div>

			<div>
				<label className="block text-sm font-medium text-gray-700 mb-1">Kolla Internal VIP Address</label>
				<input
					type="text"
					value={config.kollaIntVipAddr}
					onChange={(e) => updateField("kollaIntVipAddr", e.target.value)}
					className="input-field"
					placeholder="e.g., 172.16.38.254"
				/>
			</div>

			<div>
				<label className="block text-sm font-medium text-gray-700 mb-1">External Gateway IP</label>
				<input
					type="text"
					value={config.extGatewayIp}
					onChange={(e) => updateField("extGatewayIp", e.target.value)}
					className="input-field"
					placeholder="e.g., 10.90.38.1"
				/>
			</div>

			<div>
				<label className="block text-sm font-medium text-gray-700 mb-1">External Start IP</label>
				<input
					type="text"
					value={config.extStartIp}
					onChange={(e) => updateField("extStartIp", e.target.value)}
					className="input-field"
					placeholder="e.g., 10.90.38.50"
				/>
			</div>

			<div>
				<label className="block text-sm font-medium text-gray-700 mb-1">External End IP</label>
				<input
					type="text"
					value={config.extEndIp}
					onChange={(e) => updateField("extEndIp", e.target.value)}
					className="input-field"
					placeholder="e.g., 10.90.38.200"
				/>
			</div>

			<div>
				<label className="block text-sm font-medium text-gray-700 mb-1">VIP External IP (Optional)</label>
				<input
					type="text"
					value={config.vipExternalIp || ""}
					onChange={(e) => updateField("vipExternalIp", e.target.value)}
					className="input-field"
					placeholder="e.g., 10.90.38.254"
				/>
				<p className="text-xs text-gray-500 mt-1">
					External VIP for dashboard access. Requires controller with external interface.
				</p>
			</div>
		</div>
	);
};

export default NetworkConfigForm;

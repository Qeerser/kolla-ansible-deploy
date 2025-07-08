import React from "react";
import {
	InformationCircleIcon,
	ServerIcon,
	CircleStackIcon,
	WifiIcon,
	GlobeAltIcon,
	CogIcon,
} from "@heroicons/react/24/outline";

const HelpPage: React.FC = () => {
	return (
		<div className="glass-card p-6">
			<h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center flex items-center justify-center space-x-2">
				<InformationCircleIcon className="h-8 w-8" />
				<span>OpenStack Components Guide</span>
			</h2>

			{/* Node Types */}
			<div className="space-y-8">
				<section className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
					<h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
						<ServerIcon className="h-6 w-6 mr-2 text-blue-600" />
						Node Types
					</h3>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						<div className="border border-gray-200 rounded-lg p-4">
							<div className="flex items-center mb-3">
								<div className="w-4 h-4 bg-blue-500 rounded mr-3"></div>
								<h4 className="font-semibold text-lg">Controller Node</h4>
							</div>
							<p className="text-gray-600 mb-3">
								Manages OpenStack services like Keystone, Nova API, Glance, Horizon dashboard
							</p>
							<div className="text-sm text-gray-500">
								<p>
									<strong>Required:</strong> Management NIC
								</p>
								<p>
									<strong>Optional:</strong> External NIC for dashboard access
								</p>
								<p>
									<strong>Services:</strong> Database, Message Queue, API endpoints
								</p>
							</div>
						</div>

						<div className="border border-gray-200 rounded-lg p-4">
							<div className="flex items-center mb-3">
								<div className="w-4 h-4 bg-green-500 rounded mr-3"></div>
								<h4 className="font-semibold text-lg">Network Node</h4>
							</div>
							<p className="text-gray-600 mb-3">
								Handles networking services like Neutron L3 agent, DHCP agent
							</p>
							<div className="text-sm text-gray-500">
								<p>
									<strong>Required:</strong> Management NIC, Tunnel NIC
								</p>
								<p>
									<strong>Optional:</strong> External NIC for floating IPs
								</p>
								<p>
									<strong>Services:</strong> Neutron agents, OVS bridges
								</p>
							</div>
						</div>

						<div className="border border-gray-200 rounded-lg p-4">
							<div className="flex items-center mb-3">
								<div className="w-4 h-4 bg-purple-500 rounded mr-3"></div>
								<h4 className="font-semibold text-lg">Compute Node</h4>
							</div>
							<p className="text-gray-600 mb-3">Runs virtual machines and provides compute resources</p>
							<div className="text-sm text-gray-500">
								<p>
									<strong>Required:</strong> Management NIC, Tunnel NIC
								</p>
								<p>
									<strong>Services:</strong> Nova Compute, Neutron OVS agent
								</p>
							</div>
						</div>

						<div className="border border-gray-200 rounded-lg p-4">
							<div className="flex items-center mb-3">
								<div className="w-4 h-4 bg-orange-500 rounded mr-3"></div>
								<h4 className="font-semibold text-lg">Storage Node</h4>
							</div>
							<p className="text-gray-600 mb-3">Provides block storage services through Cinder</p>
							<div className="text-sm text-gray-500">
								<p>
									<strong>Required:</strong> Management NIC, Storage disks
								</p>
								<p>
									<strong>Services:</strong> Cinder Volume, LVM
								</p>
								<p>
									<strong>Disks:</strong> Can have multiple storage disks
								</p>
							</div>
						</div>

						<div className="border border-gray-200 rounded-lg p-4">
							<div className="flex items-center mb-3">
								<div className="w-4 h-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded mr-3"></div>
								<h4 className="font-semibold text-lg">Hybrid Node</h4>
							</div>
							<p className="text-gray-600 mb-3">
								Combines multiple roles in a single node for smaller deployments
							</p>
							<div className="text-sm text-gray-500">
								<p>
									<strong>Can be:</strong> Controller + Network + Compute + Storage
								</p>
								<p>
									<strong>Benefits:</strong> Reduced hardware requirements
								</p>
								<p>
									<strong>Use case:</strong> Development, testing, small deployments
								</p>
							</div>
						</div>
					</div>
				</section>

				{/* Network Interfaces */}
				<section className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
					<h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
						<WifiIcon className="h-6 w-6 mr-2 text-green-600" />
						Network Interfaces
					</h3>
					<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
						<div className="border border-gray-200 rounded-lg p-4">
							<h4 className="font-semibold text-lg mb-2 text-blue-600">Management Network</h4>
							<p className="text-gray-600 text-sm mb-2">
								Used for internal OpenStack API communication and management traffic
							</p>
							<div className="text-xs text-gray-500">
								<p>
									<strong>Required:</strong> All nodes
								</p>
								<p>
									<strong>Example:</strong> 172.16.100.0/24
								</p>
								<p>
									<strong>Interface:</strong> ens3
								</p>
							</div>
						</div>

						<div className="border border-gray-200 rounded-lg p-4">
							<h4 className="font-semibold text-lg mb-2 text-green-600">Tunnel Network</h4>
							<p className="text-gray-600 text-sm mb-2">
								Used for VM-to-VM communication across compute nodes
							</p>
							<div className="text-xs text-gray-500">
								<p>
									<strong>Required:</strong> Network, Compute, Storage nodes
								</p>
								<p>
									<strong>Example:</strong> 192.168.100.0/24
								</p>
								<p>
									<strong>Interface:</strong> ens4
								</p>
							</div>
						</div>

						<div className="border border-gray-200 rounded-lg p-4">
							<h4 className="font-semibold text-lg mb-2 text-purple-600">External Network</h4>
							<p className="text-gray-600 text-sm mb-2">
								Provides access to external networks and floating IPs
							</p>
							<div className="text-xs text-gray-500">
								<p>
									<strong>Required:</strong> At least one network node (for floating IPs)
								</p>
								<p>
									<strong>Optional:</strong> Controller (for dashboard access)
								</p>
								<p>
									<strong>Interface:</strong> ens5
								</p>
								<p className="text-red-600 mt-1">
									<strong>⚠️ Constraint:</strong> Deployment must have at least one network node with
									external interface
								</p>
							</div>
						</div>
					</div>
				</section>

				{/* Interface Constraints */}
				<section className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
					<h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
						<WifiIcon className="h-6 w-6 mr-2 text-red-600" />
						Interface Constraints
					</h3>
					<div className="space-y-4">
						<div className="border border-red-200 rounded-lg p-4 bg-red-50">
							<h4 className="font-semibold text-lg mb-2 text-red-700">Interface Name Requirements</h4>
							<p className="text-gray-700 text-sm mb-2">
								Each node must use unique interface names for all its network interfaces
							</p>
							<div className="text-sm text-red-700">
								<p>
									<strong>❌ Invalid:</strong> Management (ens3), Tunnel (ens3), External (ens4)
								</p>
								<p>
									<strong>✅ Valid:</strong> Management (ens3), Tunnel (ens4), External (ens5)
								</p>
								<p className="mt-2">
									<strong>Note:</strong> Interface names like ens3, ens4, ens5 must be unique within
									each node
								</p>
							</div>
						</div>

						<div className="border border-yellow-200 rounded-lg p-4 bg-yellow-50">
							<h4 className="font-semibold text-lg mb-2 text-yellow-700">Floating IP Requirement</h4>
							<p className="text-gray-700 text-sm mb-2">
								At least one network node (or hybrid with network role) must have an external interface
							</p>
							<div className="text-sm text-yellow-700">
								<p>
									<strong>Purpose:</strong> Required for OpenStack floating IP functionality
								</p>
								<p>
									<strong>Without this:</strong> Virtual machines cannot access external networks
								</p>
							</div>
						</div>
					</div>
				</section>

				{/* Storage Configuration */}
				<section className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
					<h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
						<CircleStackIcon className="h-6 w-6 mr-2 text-orange-600" />
						Storage Configuration
					</h3>
					<div className="space-y-4">
						<div className="border border-gray-200 rounded-lg p-4">
							<h4 className="font-semibold text-lg mb-2">Storage Disks</h4>
							<p className="text-gray-600 mb-3">
								Each storage node can have multiple disks for different purposes
							</p>
							<div className="bg-gray-50 p-3 rounded text-sm">
								<p>
									<strong>Disk Name:</strong> Physical disk path (e.g., /dev/sdb, /dev/sdc)
								</p>
								<p>
									<strong>Volume Group:</strong> LVM volume group name (e.g., cinder-volumes)
								</p>
								<p>
									<strong>Multiple Disks:</strong> You can add multiple disks to increase storage
									capacity
								</p>
							</div>
						</div>
						<div className="border border-gray-200 rounded-lg p-4">
							<h4 className="font-semibold text-lg mb-2">Best Practices</h4>
							<ul className="text-sm text-gray-600 space-y-1">
								<li>• Use dedicated disks for Cinder storage (separate from OS disk)</li>
								<li>• Use SSD for better I/O performance</li>
								<li>• Configure RAID for redundancy in production</li>
								<li>• Monitor disk usage and add more disks as needed</li>
							</ul>
						</div>
					</div>
				</section>

				{/* Deployment Scenarios */}
				<section className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
					<h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
						<CogIcon className="h-6 w-6 mr-2 text-indigo-600" />
						Deployment Scenarios
					</h3>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						<div className="border border-gray-200 rounded-lg p-4">
							<h4 className="font-semibold text-lg mb-2 text-green-600">Minimal Setup</h4>
							<p className="text-gray-600 text-sm mb-3">
								Perfect for testing and development environments
							</p>
							<div className="bg-green-50 p-3 rounded text-sm">
								<p>
									<strong>1 Controller Node:</strong> All control services
								</p>
								<p>
									<strong>1+ Compute Nodes:</strong> VMs and storage
								</p>
								<p>
									<strong>Total:</strong> 2+ nodes minimum
								</p>
								<p>
									<strong>Note:</strong> Controller acts as network node
								</p>
							</div>
						</div>

						<div className="border border-gray-200 rounded-lg p-4">
							<h4 className="font-semibold text-lg mb-2 text-blue-600">Production Setup</h4>
							<p className="text-gray-600 text-sm mb-3">High availability and scalable configuration</p>
							<div className="bg-blue-50 p-3 rounded text-sm">
								<p>
									<strong>3+ Controllers:</strong> HA control plane
								</p>
								<p>
									<strong>2+ Network Nodes:</strong> Dedicated networking
								</p>
								<p>
									<strong>Multiple Compute:</strong> Workload distribution
								</p>
								<p>
									<strong>Dedicated Storage:</strong> Cinder volumes
								</p>
							</div>
						</div>
					</div>
				</section>

				{/* VIP Configuration */}
				<section className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
					<h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
						<GlobeAltIcon className="h-6 w-6 mr-2 text-purple-600" />
						VIP Configuration
					</h3>
					<div className="space-y-4">
						<div className="border border-gray-200 rounded-lg p-4">
							<h4 className="font-semibold text-lg mb-2">Internal VIP</h4>
							<p className="text-gray-600 mb-2 text-sm">
								Virtual IP for internal OpenStack API endpoints (required)
							</p>
							<div className="bg-gray-50 p-3 rounded text-sm">
								<p>
									<strong>Purpose:</strong> Load balancing API requests
								</p>
								<p>
									<strong>Network:</strong> Management network
								</p>
								<p>
									<strong>Example:</strong> 172.16.100.254
								</p>
							</div>
						</div>
						<div className="border border-gray-200 rounded-lg p-4">
							<h4 className="font-semibold text-lg mb-2">External VIP (Optional)</h4>
							<p className="text-gray-600 mb-2 text-sm">
								Virtual IP for external access to Horizon dashboard
							</p>
							<div className="bg-gray-50 p-3 rounded text-sm">
								<p>
									<strong>Purpose:</strong> Public access to dashboard
								</p>
								<p>
									<strong>Network:</strong> External network
								</p>
								<p>
									<strong>Requirement:</strong> Controller must have external interface
								</p>
								<p>
									<strong>Example:</strong> 10.100.0.254
								</p>
							</div>
						</div>
					</div>
				</section>
			</div>
		</div>
	);
};

export default HelpPage;

import type { Node, NetworkConfig, TutorialStep } from "../types/index.js";

export class TutorialDataService {
	static generateTutorialSteps(nodes: Node[], networkConfig: NetworkConfig): TutorialStep[] {
		const controllerNode =
			nodes.find((node) => node.type === "controller") || nodes.find((node) => node.type === "hybrid");

		const networkNode = nodes.find((node) => node.type === "network");
		const computeNodes = nodes.filter((node) => node.type === "compute");
		const storageNodes = nodes.filter((node) => node.type === "storage");
		const hybridNodes = nodes.filter((node) => node.type === "hybrid");

		const allNodes = [controllerNode, networkNode, ...computeNodes, ...storageNodes, ...hybridNodes].filter(
			Boolean
		) as Node[];

		// Remove duplicates if controllerNode is also hybrid
		const uniqueNodes = allNodes.filter((node, index, self) => index === self.findIndex((n) => n.id === node.id));

		return [
			this.generateNetworkConfigStep(networkConfig, uniqueNodes),
			this.generateSystemPreparationStep(uniqueNodes),
			this.generatePythonInstallationStep(uniqueNodes),
			this.generateSSHSetupStep(uniqueNodes, networkConfig),
			this.generateVirtualEnvironmentStep(networkConfig, uniqueNodes),
			this.generateAnsibleInstallationStep(),
			this.generateKollaAnsibleInstallationStep(networkConfig),
			this.generateGlobalsConfigStep(networkConfig),
			this.generateInventoryStep(uniqueNodes),
			this.generateLVMVolumeStep(uniqueNodes),
			this.generatePasswordsStep(),
			this.generateAnsibleDepsStep(),
			this.generateDeploymentStep(),
			this.generateStatusCheckStep(networkConfig),
			this.generateOpenStackClientStep(),
			this.generateInitialSetupStep(networkConfig),
			this.generateDashboardAccessStep(networkConfig),
			this.generateExternalNetworkStep(uniqueNodes),
			this.generateReconfigureStep(),
		];
	}
	private static generateNetworkConfigStep(networkConfig: NetworkConfig, nodes: Node[]): TutorialStep {
		const nodeCommands = nodes.map((node) => {
			const commands = [
				`# Network configuration for ${node.hostname} (${node.type} node)`,
				"",
				"# 1. Enable systemd-networkd service",
				"$ sudo systemctl status systemd-networkd",
				"# If not active, enable and start it:",
				"$ sudo systemctl enable systemd-networkd",
				"$ sudo systemctl start systemd-networkd",
				"",
				`# 2. Configure management interface (${node.managementNic.name})`,
				`$ sudo nano /etc/systemd/network/10-${node.managementNic.name}.network`,
				"",
				"# Add the following content:",
				"[Match]",
				`Name=${node.managementNic.name}`,
				"",
				"[Network]",
				`Address=${node.managementNic.ip}/${networkConfig.managementCidr.split("/")[1]}`,
				`Gateway=${networkConfig.managementCidr.split("/")[0].split(".").slice(0, 3).join(".")}.1`,
				"DNS=8.8.8.8",
				"DNS=8.8.4.4",
				"",
			];

			// Add tunnel interface configuration if node has one
			if (node.tunnelNic) {
				commands.push(
					`# 3. Configure tunnel interface (${node.tunnelNic.name})`,
					`$ sudo nano /etc/systemd/network/20-${node.tunnelNic.name}.network`,
					"",
					"# Add the following content:",
					"[Match]",
					`Name=${node.tunnelNic.name}`,
					"",
					"[Network]",
					`Address=${node.tunnelNic.ip}/${networkConfig.tunnelCidr.split("/")[1]}`,
					""
				);
			}

			// Add external interface configuration if node has one
			if (node.externalNic) {
				commands.push(
					`# 4. Configure external interface (${node.externalNic.name})`,
					`$ sudo nano /etc/systemd/network/30-${node.externalNic.name}.network`,
					"",
					"# Add the following content:",
					"[Match]",
					`Name=${node.externalNic.name}`,
					"",
					"[Network]",
					node.externalNic.ip
						? `Address=${node.externalNic.ip}/${networkConfig.externalCidr.split("/")[1]}`
						: "# No static IP - will be managed by Neutron",
					""
				);
			}

			// Add VIP external interface configuration if node has one
			if (node.vipExternalNic) {
				commands.push(
					`# 5. Configure VIP external interface (${node.vipExternalNic.name})`,
					`$ sudo nano /etc/systemd/network/40-${node.vipExternalNic.name}.network`,
					"",
					"# Add the following content:",
					"[Match]",
					`Name=${node.vipExternalNic.name}`,
					"",
					"[Network]",
					"# No static IP - will be managed by Kolla VIP",
					""
				);
			}

			commands.push(
				"# 6. Restart networking service",
				"$ sudo systemctl restart systemd-networkd",
				"$ sudo systemctl restart networking",
				"",
				"# 7. Verify network configuration",
				"$ ip addr show",
				"$ ip route show",
				"",
				"# 8. Test connectivity to other nodes",
				...nodes
					.filter((n) => n.id !== node.id)
					.map((otherNode) => `$ ping -c 2 ${otherNode.managementNic.ip} # ${otherNode.hostname}`),
				""
			);

			return {
				nodeId: node.id,
				hostname: node.hostname,
				nodeType: `${node.type}${
					node.type === "hybrid"
						? ` (${Object.entries(node.hybridRoles || {})
								.filter(([, enabled]) => enabled)
								.map(([role]) => role)
								.join(", ")})`
						: ""
				}`,
				commands,
			};
		});

		return {
			id: 0,
			title: "Network Configuration",
			description: "Configure network interface settings for each OpenStack node",
			nodeCommands,
		};
	}

	private static generateSystemPreparationStep(nodes: Node[]): TutorialStep {
		const controllerNode = nodes.find((node) => node.type === "controller" || node.type === "hybrid");

		const nodeCommands = nodes.map((node) => {
			const commands = [
				`# System preparation for ${node.hostname} (${node.type} node)`,
				"",
				"# 1. Check system information",
				"$ uname -a",
				"# Should show: Linux ...-generic... (generic kernel recommended for Debian 12)",
				"",
				"# 2. Update system packages",
				"$ sudo apt update && sudo apt upgrade -y",
				"",
				"# 3. Check if reboot is required",
				"$ test -f /var/run/reboot-required && sudo reboot",
				"# If reboot is required, system will restart automatically",
			];

			// Add hosts file configuration only for controller node
			if (controllerNode && node.id === controllerNode.id) {
				commands.push(
					"",
					"# 4. Configure hosts file (controller node only)",
					"$ cat /etc/hosts",
					"# Current hosts file content...",
					"",
					"$ sudo nano /etc/hosts",
					"# Add the following entries at the end of the file:"
				);

				nodes.forEach((hostNode) => {
					commands.push(`${hostNode.managementNic.ip} ${hostNode.hostname}`);
				});

				commands.push(
					"",
					"# Save and exit the editor",
					"",
					"# 5. Verify hosts file configuration",
					"$ cat /etc/hosts",
					"# Should now include all node entries"
				);
			} else {
				commands.push(
					"",
					"# 4. Verify hostname resolution",
					"$ hostname",
					`# Should return: ${node.hostname}`,
					"",
					"# 5. Test connectivity to controller",
					controllerNode
						? `$ ping -c 2 ${controllerNode.managementNic.ip}`
						: "# No controller node configured"
				);
			}

			return {
				nodeId: node.id,
				hostname: node.hostname,
				nodeType: `${node.type}${
					node.type === "hybrid"
						? ` (${Object.entries(node.hybridRoles || {})
								.filter(([, enabled]) => enabled)
								.map(([role]) => role)
								.join(", ")})`
						: ""
				}`,
				commands,
			};
		});

		return {
			id: 1,
			title: "Host Preparation (Debian 12)",
			description: "Check and prepare Debian 12 host systems for each node",
			nodeCommands,
		};
	}

	private static generatePythonInstallationStep(nodes: Node[]): TutorialStep {
		const deploymentNode = nodes.find((node) => node.type === "controller" || node.type === "hybrid");

		const nodeCommands = nodes.map((node) => {
			const isDeploymentNode = node.id === deploymentNode?.id;

			if (isDeploymentNode) {
				// Deployment node - full Python installation
				const commands = [
					`# Python installation on ${node.hostname} (deployment node)`,
					"",
					"# 1. Install Python development packages for Debian 12",
					"$ sudo apt install python3-dev python3-venv python3-pip python3-setuptools python3-dbus",
					"",
					"# 2. Install additional system tools",
					"$ sudo apt install git curl wget libffi-dev gcc libssl-dev libdbus-glib-1-dev",
					"",
					"# 3. Create user for OpenStack deployment",
					"$ sudo useradd -s /bin/bash -d /opt/stack -m openstack",
					"$ sudo chmod +x /opt/stack",
					"$ echo 'openstack ALL=(ALL) NOPASSWD:ALL' | sudo tee /etc/sudoers.d/openstack",
					"# 4. Set password for kolla user (if required)",
					"$ sudo passwd openstack",
					"# Enter password when prompted",
					"",
					"# 5. Verify Python installation",
					"$ python3 --version",
					"# Should show Python 3.x.x",
					"",
					"# 6. Verify pip installation",
					"$ pip3 --version",
					"# Should show pip version information",
				];

				return {
					nodeId: node.id,
					hostname: node.hostname,
					nodeType: `${node.type}${
						node.type === "hybrid"
							? ` (${Object.entries(node.hybridRoles || {})
									.filter(([, enabled]) => enabled)
									.map(([role]) => role)
									.join(", ")})`
							: ""
					}`,
					commands,
				};
			} else {
				// Other nodes - only user setup and password configuration
				const commands = [
					`# User setup on ${node.hostname} (${node.type} node)`,
					"",
					"# 1. Create user for OpenStack deployment",
					"$ sudo useradd -s /bin/bash -d /opt/stack -m openstack",
					"$ sudo chmod +x /opt/stack",
					"$ echo 'openstack ALL=(ALL) NOPASSWD:ALL' | sudo tee /etc/sudoers.d/openstack",
					"",
					"# 2. Set password for kolla user (if required)",
					"$ sudo passwd openstack",
					"# Enter password when prompted",
					"",
					"# 3. Verify user creation",
					"$ id openstack",
					"# Should show user information",
					"",
					"# 4. Test sudo access",
					"$ sudo -u openstack whoami",
					"# Should return: openstack",
				];

				return {
					nodeId: node.id,
					hostname: node.hostname,
					nodeType: `${node.type}${
						node.type === "hybrid"
							? ` (${Object.entries(node.hybridRoles || {})
									.filter(([, enabled]) => enabled)
									.map(([role]) => role)
									.join(", ")})`
							: ""
					}`,
					commands,
				};
			}
		});

		return {
			id: 2,
			title: "Python Installation & User Setup",
			description: "Install Python on deployment node, create users on all nodes",
			nodeCommands,
		};
	}

	private static generateSSHSetupStep(nodes: Node[], networkConfig: NetworkConfig): TutorialStep {
		const controllerNode = nodes.find((node) => node.type === "controller" || node.type === "hybrid");
		const otherNodes = nodes.filter((node) => node.id !== controllerNode?.id);

		if (!controllerNode) {
			return {
				id: 3,
				title: "SSH Key Setup",
				description: "Create and distribute SSH keys",
				commands: ["# No controller node found", "# SSH setup requires a controller or hybrid node"],
			};
		}

		// Only deployment node needs SSH setup - others just need to verify
		const nodeCommands = [
			// Controller node - does all the SSH setup
			{
				nodeId: controllerNode.id,
				hostname: controllerNode.hostname,
				nodeType: `${controllerNode.type}${
					controllerNode.type === "hybrid"
						? ` (${Object.entries(controllerNode.hybridRoles || {})
								.filter(([, enabled]) => enabled)
								.map(([role]) => role)
								.join(", ")})`
						: ""
				}`,
				commands: [
					`# SSH Key setup on ${controllerNode.hostname} (deployment node)`,
					"",
					"# 1. Generate SSH key pair",
					"$ ssh-keygen",
					"# Press enter on every prompt to use defaults",
					"",
					"# 2. Distribute SSH keys to all other nodes",
					`$ for x in ${otherNodes.map((node) => node.hostname).join(" ")}; do ssh-copy-id ${
						networkConfig.kollaUser
					}@$x; done`,
					"",
					"# 3. Test SSH connectivity to all nodes",

					`$ for x in ${otherNodes.map((node) => node.hostname).join(" ")}; do ssh ${
						networkConfig.kollaUser
					}@$x 'lsb_release -a; uname -a'; done`,

					"",
					"# 4. Test network connectivity",

					...otherNodes.map((node) => `$ ssh ${node.hostname} ping -c 2 ${node.managementNic.ip}`),
					"",
					"# SSH setup complete from deployment node",
				],
			},
			// Other nodes - just verification
			...otherNodes.map((node) => ({
				nodeId: node.id,
				hostname: node.hostname,
				nodeType: `${node.type}${
					node.type === "hybrid"
						? ` (${Object.entries(node.hybridRoles || {})
								.filter(([, enabled]) => enabled)
								.map(([role]) => role)
								.join(", ")})`
						: ""
				}`,
				commands: [
					`# SSH verification on ${node.hostname}`,
					"",
					"# 1. Verify SSH key was installed by deployment node",
					"$ cat ~/.ssh/authorized_keys",
					"# Should contain the public key from deployment node",
					"",
					"# 2. Test reverse SSH connection to deployment node",
					`$ ssh ${networkConfig.kollaUser}@${controllerNode.hostname} 'hostname'`,
					`# Should return: ${controllerNode.hostname}`,
					"",
					"# 3. Verify network connectivity",
					`$ ping -c 2 ${controllerNode.managementNic.ip}`,
					"# Should successfully ping deployment node",
					"",
					"# Verification complete",
				],
			})),
		];

		return {
			id: 3,
			title: "SSH Key Setup",
			description: "Create and distribute SSH keys from deployment node only",
			nodeCommands,
		};
	}

	private static generateVirtualEnvironmentStep(networkConfig: NetworkConfig, nodes: Node[]): TutorialStep {
		const controllerNode = nodes.find((node) => node.type === "controller" || node.type === "hybrid");
		const controllerHostname = controllerNode?.hostname || "controller01";
		const userName = networkConfig.kollaUser || "openstack";

		return {
			id: 4,
			title: "Virtual Environment Setup",
			description: "Create Python virtual environment for Kolla-Ansible 2025.1",
			commands: [
				"$ cd $HOME",
				"$ mkdir $HOME/kolla-ops",
				"$ python3 -m venv $HOME/kolla-ops",
				"$ source $HOME/kolla-ops/bin/activate",
				`(kolla-ops) ${userName}@${controllerHostname}:~$ `,
				"(kolla-ops)...:~$",
				"(kolla-ops)...:~$ pip install -U pip",
				"(kolla-ops)...:~$ pip install docker dbus-python",
			],
		};
	}

	private static generateAnsibleInstallationStep(): TutorialStep {
		return {
			id: 5,
			title: "Ansible Installation (2025.1 Compatible)",
			description: "Install Ansible compatible with Kolla-Ansible 2025.1",
			commands: [
				"(kolla-ops)...:~$ pip install 'ansible>=10,<12'",
				"(kolla-ops)...:~$ nano $HOME/ansible.cfg",
				"",
				"(kolla-ops)...:~$ cat $HOME/ansible.cfg",
				"",
				"[defaults]",
				"host_key_checking=False",
				"pipelining=True",
				"forks=100",
				"timeout=30",
				"",
				"(kolla-ops)...:~$",
			],
		};
	}

	private static generateKollaAnsibleInstallationStep(networkConfig: NetworkConfig): TutorialStep {
		return {
			id: 6,
			title: "Kolla-Ansible 2025.1 Installation",
			description: "Install Kolla-Ansible 2025.1 and create configuration files",
			commands: [
				"(kolla-ops)...:~$ pip install git+https://opendev.org/openstack/kolla-ansible@stable/2025.1",
				"(kolla-ops)...:~$ sudo mkdir -p /etc/kolla",
				`(kolla-ops)...:~$ sudo chown ${networkConfig.kollaUser}:${networkConfig.kollaUser} /etc/kolla`,
				"(kolla-ops)...:~$ cp $HOME/kolla-ops/share/kolla-ansible/etc_examples/kolla/* /etc/kolla/",
				"(kolla-ops)...:~$ cp $HOME/kolla-ops/share/kolla-ansible/ansible/inventory/* .",
				"(kolla-ops)...:~$ ls -la /etc/kolla",
				"globals.yml  passwords.yml",
				"(kolla-ops)...:~$ ",
			],
		};
	}

	private static generateGlobalsConfigStep(networkConfig: NetworkConfig): TutorialStep {
		const commands = [
			"(kolla-ops)...:~$ nano /etc/kolla/globals.yml",
			"",
			"# --> For ansible and kolla options (2025.1):",
			"# --> uncomment or add the following lines",
			"",
			"workaround_ansible_issue_8743: yes",
			'config_strategy: "COPY_ALWAYS"',
			'kolla_base_distro: "debian"',
			'openstack_release: "2025.1"',
			`kolla_internal_vip_address: "${networkConfig.kollaIntVipAddr}"`,
			// `kolla_external_vip_address: "${networkConfig.vipExternalIp || ""}"`,
			"",
			"# --> For container engine options:",
			"# --> uncomment or add the following lines",
			"",
			"kolla_container_engine: docker",
			// "docker_registry: quay.io",
			// "docker_namespace: openstack.kolla",
			"",
			"# --> For neutron networking options:",
			"# --> uncomment or add the following lines",
			"",
			'network_address_family: "ipv4"',
			'neutron_plugin_agent: "openvswitch"',
			"",
			"# --> For openstack core options:",
			"# --> uncomment or add the following lines",
			"",
			'enable_openstack_core: "yes"',
			'enable_glance: "{{ enable_openstack_core | bool }}"',
			'enable_haproxy: "yes"',
			'enable_keepalived: "{{ enable_haproxy | bool }}"',
			'enable_keystone: "{{ enable_openstack_core | bool }}"',
			'enable_mariadb: "yes"',
			'enable_memcached: "yes"',
			'enable_neutron: "{{ enable_openstack_core | bool }}"',
			'enable_nova: "{{ enable_openstack_core | bool }}"',
			"enable_rabbitmq: \"{{ 'yes' if om_rpc_transport == 'rabbit' or om_notify_transport == 'rabbit' else 'no' }}\"",
			"",
			"# --> For specific openstack services:",
			"# --> uncomment or add the following lines",
			"",
			'enable_cinder: "yes"',
			'enable_cinder_backend_lvm: "yes"',
			'enable_etcd: "yes"',
			'enable_horizon: "{{ enable_openstack_core | bool }}"',
			'enable_placement: "{{ enable_nova | bool or enable_zun | bool }}"',
			'glance_backend_file: "yes"',
			'cinder_volume_group: "cinder-volumes"',
		];

		if (networkConfig.vipExternalIp) {
			commands.push(`kolla_external_vip_address: "${networkConfig.vipExternalIp}"`);
		}

		return {
			id: 7,
			title: "Global Configuration (2025.1 with Debian 12)",
			description: "Configure Kolla-Ansible 2025.1 global settings for Debian 12",
			commands,
		};
	}

	private static generateInventoryStep(nodes: Node[]): TutorialStep {
		const controllerNodes = nodes.filter(
			(node) => node.type === "controller" || (node.type === "hybrid" && node.hybridRoles?.controller)
		);
		const networkNodes = nodes.filter(
			(node) => node.type === "network" || (node.type === "hybrid" && node.hybridRoles?.network)
		);
		const computeNodes = nodes.filter(
			(node) => node.type === "compute" || (node.type === "hybrid" && node.hybridRoles?.compute)
		);
		const storageNodes = nodes.filter(
			(node) => node.type === "storage" || (node.type === "hybrid" && node.hybridRoles?.storage)
		);

		const commands = [
			"(kolla-ops)...:~$ cp $HOME/kolla-ops/share/kolla-ansible/ansible/inventory/multinode .",
			"(kolla-ops)...:~$ nano multinode",
			"...",
			"[control]",
		];

		// Add controller nodes
		controllerNodes.forEach((node) => {
			const connectionType = node.type === "controller" ? "ansible_connection=local" : "";
			commands.push(`${node.hostname} ${connectionType} network_interface=${node.managementNic.name}`.trim());
		});

		commands.push("", "[network]");

		// Add network nodes
		networkNodes.forEach((node) => {
			const extNic = node.externalNic ? ` neutron_external_interface=${node.externalNic.name}` : "";
			commands.push(
				`${node.hostname} network_interface=${node.managementNic.name} tunnel_interface=${
					node.tunnelNic?.name || "ens4"
				}${extNic}`
			);
		});

		commands.push("", "[compute]");

		// Add compute nodes
		computeNodes.forEach((node) => {
			commands.push(
				`${node.hostname} network_interface=${node.managementNic.name} tunnel_interface=${
					node.tunnelNic?.name || "ens4"
				}`
			);
		});

		commands.push("", "[monitoring]");
		if (controllerNodes.length > 0) {
			commands.push(
				`${controllerNodes[0].hostname} ansible_connection=local network_interface=${controllerNodes[0].managementNic.name}`
			);
		}

		commands.push("", "[storage]");
		storageNodes.forEach((node) => {
			commands.push(`${node.hostname} network_interface=${node.managementNic.name}`);
		});

		commands.push("...");

		return {
			id: 8,
			title: "Multinode Inventory Configuration",
			description: "Configure Ansible inventory for multinode deployment",
			commands,
		};
	}

	private static generateLVMVolumeStep(nodes: Node[]): TutorialStep {
		// Only include nodes that have storage disks configured
		const storageNodes = nodes.filter(
			(node) =>
				(node.type === "storage" ||
					node.type === "compute" ||
					(node.type === "hybrid" && (node.hybridRoles?.storage || node.hybridRoles?.compute))) &&
				node.storageDisks &&
				node.storageDisks.length > 0
		);

		// If no storage nodes with disks, return a simple step
		if (storageNodes.length === 0) {
			return {
				id: 9,
				title: "LVM Volume Creation",
				description: "Create LVM volumes for Cinder storage",
				commands: [
					"# No storage nodes with configured disks found",
					"# This step would normally create LVM volumes for Cinder storage",
					"# on nodes with storage disks configured",
					"",
					"# Please configure storage disks in the node configuration",
					"# before proceeding with LVM volume creation",
					"",
					`On ${nodes.find((n) => n.type === "controller" || n.type === "hybrid")?.hostname || "controller"}`,
					"(kolla-ops)...:~$ # Continue to next step",
				],
			};
		}

		const nodeCommands = storageNodes.map((node) => {
			const commands = [
				`# LVM Volume setup for ${node.hostname} (${node.type} node)`,
				"",
				"# 1. Install LVM tools",
				"$ sudo apt install lvm2 thin-provisioning-tools",
				"",
				"# 2. Create physical volumes and volume groups",
			];

			// Add commands for each storage disk
			if (node.storageDisks && node.storageDisks.length > 0) {
				node.storageDisks.forEach((disk) => {
					commands.push(`$ sudo pvcreate ${disk.name}`);
					commands.push(`$ sudo vgcreate ${disk.volumeGroup} ${disk.name}`);
				});
			}

			commands.push(
				"",
				"# 3. Verify volume group creation",
				"$ sudo vgs",
				"  VG             #PV #LV #SN Attr   VSize   VFree",
				"cinder-volumes   1   0   0 wz--n- <80.00g <80.00g",
				"",
				"# 4. Exit to controller node",
				"$ exit"
			);

			return {
				nodeId: node.id,
				hostname: node.hostname,
				nodeType: `${node.type}${
					node.type === "hybrid"
						? ` (${Object.entries(node.hybridRoles || {})
								.filter(([, enabled]) => enabled)
								.map(([role]) => role)
								.join(", ")})`
						: ""
				}`,
				commands,
			};
		});

		return {
			id: 9,
			title: "LVM Volume Creation",
			description: "Create LVM volumes for Cinder storage on nodes with configured disks",
			nodeCommands,
		};
	}

	private static generatePasswordsStep(): TutorialStep {
		return {
			id: 10,
			title: "Generate Passwords",
			description: "Generate passwords for OpenStack services",
			commands: ["(kolla-ops)...:~$ kolla-genpwd", "(kolla-ops)...:~$"],
		};
	}

	private static generateAnsibleDepsStep(): TutorialStep {
		return {
			id: 11,
			title: "Install Ansible Dependencies",
			description: "Install required Ansible galaxy dependencies",
			commands: ["(kolla-ops)...:~$ kolla-ansible install-deps", "(kolla-ops)...:~$"],
		};
	}

	private static generateDeploymentStep(): TutorialStep {
		return {
			id: 12,
			title: "Deploy OpenStack",
			description: "Bootstrap, precheck, and deploy OpenStack",
			commands: [
				" (kolla-ops)...:~$ kolla-ansible bootstrap-servers -i multinode ",
				" ...",
				" (kolla-ops)...:~$ kolla-ansible prechecks -i multinode ",
				" ...",
				" (kolla-ops)...:~$ kolla-ansible deploy -i multinode ",
				" ...",
			],
		};
	}

	private static generateStatusCheckStep(networkConfig: NetworkConfig): TutorialStep {
		return {
			id: 13,
			title: "Status Check",
			description: "Check OpenStack deployment status",
			commands: [
				"(kolla-ops)...:~$ sudo docker ps",
				"... outputs ...",
				`(kolla-ops)...:~$ sudo usermod -aG docker ${networkConfig.kollaUser}`,
				`(kolla-ops)...:~$ groups ${networkConfig.kollaUser}`,
				`# --> you will see that user ${networkConfig.kollaUser} is in the docker group`,
				"(kolla-ops)...:~$ docker ps",
				"# --> but this command still does not work since the shell is the old shell",
				"(kolla-ops)...:~$ exit",
				"",
				"$  # --> after login or run a new shell",
				`$ groups ${networkConfig.kollaUser}`,
				`# --> you will see ${networkConfig.kollaUser} being added in the docker group.`,
				"$ source $HOME/kolla-ops/bin/activate",
				"(kolla-ops)...:~$ docker ps",
				"(kolla-ops)...:~$ docker inspect nova_api",
				"...",
				"info and status of nova_api",
				" ...",
			],
		};
	}

	private static generateOpenStackClientStep(): TutorialStep {
		return {
			id: 14,
			title: "Install OpenStack Client (2025.1)",
			description: "Install OpenStack client software for 2025.1",
			commands: [
				"(kolla-ops)...:~$ pip install python-openstackclient -c https://releases.openstack.org/constraints/upper/2025.1",
				"(kolla-ops)...:~$ pip install python-neutronclient -c https://releases.openstack.org/constraints/upper/2025.1",
				"(kolla-ops)...:~$ pip install python-keystoneclient -c https://releases.openstack.org/constraints/upper/2025.1",
				"(kolla-ops)...:~$ pip install python-glanceclient -c https://releases.openstack.org/constraints/upper/2025.1",
				"(kolla-ops)...:~$ pip install python-heatclient -c https://releases.openstack.org/constraints/upper/2025.1",
				"(kolla-ops)...:~$ pip install python-cinderclient -c https://releases.openstack.org/constraints/upper/2025.1",
				"(kolla-ops)...:~$ pip install python-novaclient -c https://releases.openstack.org/constraints/upper/2025.1",
				"(kolla-ops)...:~$ ",
			],
		};
	}

	private static generateInitialSetupStep(networkConfig: NetworkConfig): TutorialStep {
		return {
			id: 15,
			title: "Initial Setup",
			description: "Run initial OpenStack setup script",
			commands: [
				"(kolla-ops)...:~$ kolla-ansible post-deploy -i multinode",
				"(kolla-ops)...:~$ source /etc/kolla/admin-openrc.sh",
				"# --> you have to run the command above to use openstack CLI.",
				"(kolla-ops)...:~$ ",
				"(kolla-ops)...:~$ openstack service list",
				"... output table...",
				"(kolla-ops)...:~$ ls kolla-ops/share/kolla-ansible/init-runonce",
				"kolla-ops/share/kolla-ansible/init-runonce",
				"(kolla-ops)...:~$ ",
				"(kolla-ops)...:~$ nano kolla-ops/share/kolla-ansible/init-runonce",
				"",
				"# --> change the following lines",
				"",
				`EXT_NET_CIDR=\${EXT_NET_CIDR:-'${networkConfig.externalCidr}'}`,
				`EXT_NET_RANGE=\${EXT_NET_RANGE:-'start=${networkConfig.extStartIp},end=${networkConfig.extEndIp}'}`,
				`EXT_NET_GATEWAY=\${EXT_NET_GATEWAY:-'${networkConfig.extGatewayIp}'}`,
				"",
				"# --> save file",
				"(kolla-ops)...:~$ ./kolla-ops/share/kolla-ansible/init-runonce",
				"",
				"... outputs ...",
				"",
				"(kolla-ops)...:~$ ",
			],
		};
	}

	private static generateDashboardAccessStep(networkConfig: NetworkConfig): TutorialStep {
		return {
			id: 16,
			title: "Dashboard Access",
			description: "Access OpenStack Horizon dashboard",
			commands: [
				`# Access Horizon dashboard at http://${networkConfig.kollaIntVipAddr}`,
				"# Username: admin",
				"# Password: (check /etc/kolla/passwords.yml for keystone_admin_password)",
				"",
				"(kolla-ops)...:~$ grep keystone_admin_password /etc/kolla/passwords.yml",
				"keystone_admin_password: your_generated_password",
			],
		};
	}

	private static generateExternalNetworkStep(nodes: Node[]): TutorialStep {
		const controllerNode = nodes.find((node) => node.type === "controller" || node.type === "hybrid");

		return {
			id: 17,
			title: "External Network Access (Optional)",
			description: "Configure external network access",
			commands: [
				`On ${controllerNode?.hostname || "controller"} host:`,
				`$ sudo ip address add a.b.c.d/e dev ${controllerNode?.externalNic?.name || "ens5"}`,
				`$ sudo ip link set ${controllerNode?.externalNic?.name || "ens5"} up`,
			],
		};
	}

	private static generateReconfigureStep(): TutorialStep {
		return {
			id: 18,
			title: "Reconfigure OpenStack",
			description: "Reconfigure OpenStack for additional changes",
			commands: [
				"$(kolla-ops)...:~$ source $HOME/kolla-ops/bin/activate",
				"(kolla-ops)...:~$ kolla-ansible reconfigure -i multinode ",
			],
		};
	}
}

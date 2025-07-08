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
			this.generateSystemPreparationStep(uniqueNodes),
			this.generatePythonInstallationStep(),
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

	private static generateSystemPreparationStep(nodes: Node[]): TutorialStep {
		const controllerNode = nodes.find((node) => node.type === "controller" || node.type === "hybrid");

		let commands = [
			"# On every host:",
			"",
			"$ uname -a",
			"Linux ...-generic... # <-- generic kernel is recommended for Debian 12",
			"$ sudo apt update && sudo apt upgrade -y",
			"$ test -f /var/run/reboot-required && sudo reboot",
			"",
		];

		if (controllerNode) {
			commands = commands.concat([`On ${controllerNode.hostname} host:`, "", "$ cat /etc/hosts", "..."]);

			// Add each node's hostname mapping
			nodes.forEach((node) => {
				commands.push(`${node.managementNic.ip} ${node.hostname}`);
			});

			commands = commands.concat([
				"...",
				`$ sudo nano /etc/hosts`,
				"# Add all node hostnames to /etc/hosts file",
			]);
		}

		return {
			id: 1,
			title: "Host Preparation (Debian 12)",
			description: "Check and prepare Debian 12 host systems",
			commands,
		};
	}

	private static generatePythonInstallationStep(): TutorialStep {
		return {
			id: 2,
			title: "Python Installation (Debian 12)",
			description: "Install Python and required packages on Debian 12",
			commands: [
				"# Install Python development packages for Debian 12",
				"$ sudo apt install python3-dev python3-venv python3-pip python3-setuptools",
				"$ sudo apt install git curl wget",
				"",
				"# Create user for OpenStack deployment",
				"$ sudo useradd -s /bin/bash -d /opt/stack -m openstack",
				"$ sudo chmod +x /opt/stack",
				"$ echo 'openstack ALL=(ALL) NOPASSWD:ALL' | sudo tee /etc/sudoers.d/openstack",
			],
		};
	}

	private static generateSSHSetupStep(nodes: Node[], networkConfig: NetworkConfig): TutorialStep {
		const controllerNode = nodes.find((node) => node.type === "controller" || node.type === "hybrid");
		const otherNodes = nodes.filter((node) => node.id !== controllerNode?.id);

		const nodeList = otherNodes.map((node) => node.hostname).join(" ");

		return {
			id: 3,
			title: "SSH Key Setup",
			description: "Create and distribute SSH keys",
			commands: [
				"$ ssh-keygen",
				"...",
				"press enter on every prompt",
				"...",
				`$ for x in ${nodeList}; do ssh-copy-id ${networkConfig.kollaUser}@$x; done`,
				"$ ",
				"# Test connectivity",
				`$ for x in ${nodeList}; do \\`,
				`     ssh ${networkConfig.kollaUser}@$x 'lsb_release -a; uname -a'; done`,
				"$ ",
				"# Test network connectivity",
				...otherNodes.map((node) => `$ ssh ${node.hostname} ping -c 2 ${node.managementNic.ip}`),
			],
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
				"(kolla-ops)...:~$ pip install -U pip setuptools wheel",
			],
		};
	}

	private static generateAnsibleInstallationStep(): TutorialStep {
		return {
			id: 5,
			title: "Ansible Installation (2025.1 Compatible)",
			description: "Install Ansible compatible with Kolla-Ansible 2025.1",
			commands: [
				"(kolla-ops)...:~$ pip install 'ansible>=9,<10'",
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
			"",
			"# --> For container engine options:",
			"# --> uncomment or add the following lines",
			"",
			"kolla_container_engine: docker",
			"docker_registry: quay.io",
			"docker_namespace: openstack.kolla",
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
		const storageNodes = nodes.filter(
			(node) =>
				node.type === "storage" ||
				node.type === "compute" ||
				(node.type === "hybrid" && (node.hybridRoles?.storage || node.hybridRoles?.compute))
		);

		const commands = [];

		storageNodes.forEach((node, index) => {
			if (index > 0) commands.push("");

			commands.push(`On ${node.hostname}:`);
			commands.push("...");
			commands.push("$ sudo apt install lvm2 thin-provisioning-tools");

			// Add commands for each storage disk
			if (node.storageDisks && node.storageDisks.length > 0) {
				node.storageDisks.forEach((disk) => {
					commands.push(`$ sudo pvcreate ${disk.name}`);
					commands.push(`$ sudo vgcreate ${disk.volumeGroup} ${disk.name}`);
				});
			} else {
				// Default disk if none specified
				commands.push("$ sudo pvcreate /dev/sdb");
				commands.push("$ sudo vgcreate cinder-volumes /dev/sdb");
			}

			commands.push("$ sudo vgs");
			commands.push("  VG             #PV #LV #SN Attr   VSize   VFree");
			commands.push("cinder-volumes   1   0   0 wz--n- <80.00g <80.00g");
			commands.push("$");
			commands.push("$ exit");
		});

		commands.push(
			"",
			`On ${nodes.find((n) => n.type === "controller" || n.type === "hybrid")?.hostname || "controller"}`,
			"..."
		);
		commands.push("(kolla-ops)...:~$ ");

		return {
			id: 9,
			title: "LVM Volume Creation",
			description: "Create LVM volumes for Cinder storage",
			commands,
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
				" (kolla-ops)...:~$ kolla-ansible -i multinode bootstrap-servers",
				" ...",
				" (kolla-ops)...:~$ kolla-ansible -i multinode prechecks",
				" ...",
				" (kolla-ops)...:~$ kolla-ansible -i multinode deploy",
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
				"(kolla-ops)...:~$ kolla-ansible post-deploy",
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
				"(kolla-ops)...:~$ kolla-ansible -i multinode reconfigure",
			],
		};
	}
}

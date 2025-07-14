# Kolla OpenStack Installation Helper

A modern React + TypeScript web application for configuring and generating installation tutorials for OpenStack using Kolla Ansible. This tool provides a dynamic interface for managing nodes and network configurations, replacing the static canvas-based approach with an intuitive form-based system.

Currently, two official plugins are available:

-   [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
-   [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config([
	globalIgnores(["dist"]),
	{
		files: ["**/*.{ts,tsx}"],
		extends: [
			// Other configs...

			// Remove tseslint.configs.recommended and replace with this
			...tseslint.configs.recommendedTypeChecked,
			// Alternatively, use this for stricter rules
			...tseslint.configs.strictTypeChecked,
			// Optionally, add this for stylistic rules
			...tseslint.configs.stylisticTypeChecked,

			// Other configs...
		],
		languageOptions: {
			parserOptions: {
				project: ["./tsconfig.node.json", "./tsconfig.app.json"],
				tsconfigRootDir: import.meta.dirname,
			},
			// other options...
		},
	},
]);
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from "eslint-plugin-react-x";
import reactDom from "eslint-plugin-react-dom";

export default tseslint.config([
	globalIgnores(["dist"]),
	{
		files: ["**/*.{ts,tsx}"],
		extends: [
			// Other configs...
			// Enable lint rules for React
			reactX.configs["recommended-typescript"],
			// Enable lint rules for React DOM
			reactDom.configs.recommended,
		],
		languageOptions: {
			parserOptions: {
				project: ["./tsconfig.node.json", "./tsconfig.app.json"],
				tsconfigRootDir: import.meta.dirname,
			},
			// other options...
		},
	},
]);
```

## 🚀 Features

-   **Dynamic Node Management**: Add, remove, and configure nodes dynamically
-   **Network Configuration**: Comprehensive network settings with validation
-   **Real-time Validation**: IP address and CIDR validation with detailed feedback
-   **Tutorial Generation**: Step-by-step installation commands with copy-to-clipboard functionality
-   **Modern UI**: Built with Tailwind CSS featuring glassmorphism design
-   **Responsive Design**: Works perfectly on desktop and mobile devices
-   **TypeScript**: Full type safety throughout the application

## 🛠️ Technology Stack

-   **React 18** with TypeScript
-   **Vite** for fast development and building
-   **Tailwind CSS** for styling
-   **Heroicons** for beautiful icons
-   **Modern JavaScript/TypeScript** with ES6+ features

## 📋 Prerequisites

-   Node.js 16+
-   npm or yarn package manager

## 🏃‍♂️ Getting Started

1. **Install dependencies**

    ```bash
    npm install
    ```

2. **Start the development server**

    ```bash
    npm run dev
    ```

3. **Open your browser**
   Navigate to `http://localhost:5173`

## 🎯 Usage

### 1. Configure Network Settings

-   Set Management Network CIDR
-   Configure Tunnel Network CIDR
-   Define External Network settings
-   Specify Kolla user and VIP address

### 2. Manage Nodes

-   Add/remove nodes dynamically
-   Configure node types (controller, network, compute, storage)
-   Set network interfaces for each node
-   Define IP addresses for management, tunnel, and external networks

### 3. Generate Tutorial

-   Click "Generate Tutorial" to validate configuration
-   View detailed validation results
-   Copy installation commands with one-click
-   Follow step-by-step OpenStack installation guide

## 📝 Available Scripts

-   `npm run dev` - Start development server
-   `npm run build` - Build for production
-   `npm run preview` - Preview production build
-   `npm run lint` - Run ESLint
# kolla-ansible-deploy

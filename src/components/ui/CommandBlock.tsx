import React from "react";
import { ClipboardIcon, CheckIcon } from "@heroicons/react/24/outline";

interface CommandBlockProps {
	commands: string[];
	title?: string;
	index: string | number;
	onCopy: (text: string, index: string | number) => void;
	copiedIndex: string | number | null;
}

const CommandBlock: React.FC<CommandBlockProps> = ({ commands, title, index, onCopy, copiedIndex }) => {
	const formatCommand = (cmd: string) => {
		const isComment = cmd.startsWith("#") || cmd.startsWith("//");
		const isEmpty = cmd.trim() === "";

		if (isEmpty) return cmd;
		if (isComment) return cmd.slice(1).trim();

		// Split prompt and command
		if (cmd.includes("$ ")) {
			const parts = cmd.split("$ ");
			if (parts.length > 1) {
				return (
					<>
						<span className="prompt-text">{parts[0]}$</span>
						<span className="command-text"> {parts.slice(1).join("$ ")}</span>
					</>
				);
			}
		}

		if (cmd.includes("...:")) {
			const parts = cmd.split(":");
			if (parts.length > 1) {
				return (
					<>
						<span className="prompt-text">{parts[0]}:</span>
						<span className="command-text">{parts.slice(1).join(":")}</span>
					</>
				);
			}
		}

		return <span className={isComment ? "comment-text" : "command-text"}>{cmd}</span>;
	};

	const getCommandsOnly = (cmds: string[]): string => {
		return cmds
			.map((cmd) => {
				if (cmd.includes("$ ")) {
					const parts = cmd.split("$ ");
					return parts.slice(1).join("$ ");
				}
				return cmd;
			})
			.filter((cmd) => !cmd.startsWith("#") && !cmd.startsWith("//") && cmd.trim() !== "")
			.join("\n");
	};

	const hasExecutableCommands = commands.some(
		(cmd) => !cmd.startsWith("#") && !cmd.startsWith("//") && cmd.trim() !== ""
	);

	return (
		<div className="command-block bg-gray-900 rounded-lg p-4 mb-4">
			<div className="flex items-center justify-between mb-2">
				{title && <h4 className="text-sm font-medium text-gray-300">{title}</h4>}
				{hasExecutableCommands && (
					<button
						onClick={() => onCopy(getCommandsOnly(commands), index)}
						className="flex items-center space-x-2 px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
						title="Copy all commands"
					>
						{copiedIndex === index ? (
							<>
								<CheckIcon className="h-3 w-3" />
								<span>Copied!</span>
							</>
						) : (
							<>
								<ClipboardIcon className="h-3 w-3" />
								<span>Copy Block</span>
							</>
						)}
					</button>
				)}
			</div>

			<div className="space-y-1">
				{commands.map((command, cmdIndex) => {
					const isComment = command.startsWith("#") || command.startsWith("//");
					const isEmpty = command.trim() === "";

					return (
						<div
							key={cmdIndex}
							className={`font-mono text-sm ${
								isComment ? "text-gray-500" : isEmpty ? "" : "text-gray-100"
							}`}
						>
							{formatCommand(command)}
						</div>
					);
				})}
			</div>
		</div>
	);
};

export default CommandBlock;

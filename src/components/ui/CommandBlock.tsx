import React from "react";
import { ClipboardIcon, CheckIcon } from "@heroicons/react/24/outline";

interface CommandBlockProps {
	commands: string[];
	title?: string;
	index: string | number;
	onCopy: (text: string, index: string | number, type?: string) => void;
	copiedIndex: string | number | null;
	copiedType?: string;
}

const CommandBlock: React.FC<CommandBlockProps> = ({ commands, title, index, onCopy, copiedIndex, copiedType }) => {
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
				// Extract actual commands after $ prompt
				if (cmd.includes("$ ")) {
					const parts = cmd.split("$ ");
					return parts.slice(1).join("$ ");
				}
				// Skip prompts like "(kolla-ops)...:~$" without commands
				if (cmd.includes(":~$") && !cmd.includes("$ ")) {
					return "";
				}
				return cmd;
			})
			.filter((cmd) => 
				!cmd.startsWith("#") && 
				!cmd.startsWith("//") && 
				!cmd.startsWith("...") &&
				!cmd.includes("outputs") &&
				!cmd.includes("press enter") &&
				cmd.trim() !== "" &&
				!cmd.includes("info and status")
			)
			.join("\n");
	};

	const getExecutableCommandsOnly = (cmds: string[]): string => {
		return cmds
			.map((cmd) => {
				// Extract commands after $ prompt
				if (cmd.includes("$ ")) {
					const parts = cmd.split("$ ");
					const command = parts.slice(1).join("$ ");
					// Skip test commands and display commands
					if (command.startsWith("cat ") || 
						command.startsWith("ls ") || 
						command.startsWith("groups ") ||
						command.startsWith("grep ") ||
						command.includes("lsb_release") ||
						command.includes("uname")) {
						return "";
					}
					return command;
				}
				return "";
			})
			.filter((cmd) => cmd.trim() !== "")
			.join("\n");
	};

	const hasExecutableCommands = commands.some(
		(cmd) => !cmd.startsWith("#") && !cmd.startsWith("//") && cmd.trim() !== ""
	);

	const hasActualExecutableCommands = getExecutableCommandsOnly(commands).trim() !== "";

	return (
		<div className="command-block bg-gray-900 rounded-lg p-4 mb-4">
			<div className="flex items-center justify-between mb-2">
				{title && <h4 className="text-sm font-medium text-gray-300">{title}</h4>}
				{hasExecutableCommands && (
					<div className="flex space-x-2">
						{hasActualExecutableCommands && (
							<button
								onClick={() => onCopy(getExecutableCommandsOnly(commands), `${index}-exec`, "exec")}
								className="flex items-center space-x-2 px-3 py-1 text-xs bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
								title="Copy executable commands only"
							>
								{copiedIndex === `${index}-exec` && copiedType === "exec" ? (
									<>
										<CheckIcon className="h-3 w-3" />
										<span>Copied!</span>
									</>
								) : (
									<>
										<ClipboardIcon className="h-3 w-3" />
										<span>Commands</span>
									</>
								)}
							</button>
						)}
						<button
							onClick={() => onCopy(getCommandsOnly(commands), index, "all")}
							className="flex items-center space-x-2 px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
							title="Copy all commands"
						>
							{copiedIndex === index && copiedType === "all" ? (
								<>
									<CheckIcon className="h-3 w-3" />
									<span>Copied!</span>
								</>
							) : (
								<>
									<ClipboardIcon className="h-3 w-3" />
									<span>All</span>
								</>
							)}
						</button>
					</div>
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

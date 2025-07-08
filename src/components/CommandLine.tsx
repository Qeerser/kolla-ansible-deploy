import React from "react";
import { ClipboardIcon, CheckIcon } from "@heroicons/react/24/outline";

interface CommandLineProps {
	command: string;
	index: string | number;
	onCopy: (text: string, index: string | number) => void;
	copiedIndex: string | number | null;
}

const CommandLine: React.FC<CommandLineProps> = ({ command, index, onCopy, copiedIndex }) => {
	const isComment = command.startsWith("#") || command.startsWith("//");
	const isEmpty = command.trim() === "";

	const formatCommand = (cmd: string) => {
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

	const getCommandOnly = (cmd: string) => {
		if (cmd.includes("$ ")) {
			const parts = cmd.split("$ ");
			return parts.slice(1).join("$ ");
		}
		return cmd;
	};

	return (
		<div className={`command-line `}>
			<div className="flex items-center justify-between">
				<div className="flex-1 font-mono text-sm">{formatCommand(command)}</div>
				{!isEmpty && !isComment && (
					<button
						onClick={() => onCopy(getCommandOnly(command), index)}
						className="ml-3 p-1 text-gray-400 hover:text-blue-400 transition-colors"
						title="Copy command"
					>
						{copiedIndex === index ? (
							<CheckIcon className="h-4 w-4 text-green-400" />
						) : (
							<ClipboardIcon className="h-4 w-4" />
						)}
					</button>
				)}
			</div>
		</div>
	);
};

export default CommandLine;

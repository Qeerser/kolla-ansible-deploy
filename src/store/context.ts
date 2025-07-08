import { createContext } from "react";
import type { AppState, AppAction } from "./types.js";

// Context
export const AppContext = createContext<{
	state: AppState;
	dispatch: React.Dispatch<AppAction>;
} | null>(null);

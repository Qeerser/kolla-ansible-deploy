import { useReducer } from "react";
import type { ReactNode } from "react";
import { AppContext } from "./context.js";
import { appReducer, initialState } from "./reducer.js";

// Provider component
export function AppProvider({ children }: { children: ReactNode }) {
	const [state, dispatch] = useReducer(appReducer, initialState);

	return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>;
}

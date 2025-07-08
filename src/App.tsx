import { AppProvider } from "./store/AppProvider.js";
import KollaHelper from "./components/KollaHelper.js";
import "./index.css";

function App() {
	return (
		<AppProvider>
			<KollaHelper />
		</AppProvider>
	);
}

export default App;

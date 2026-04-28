import BrowseRouter from "./BrowseRouter";
import { SecurityProvider } from "./context/SecurityContext";
import ErrorBoundary from "./components/ErrorBoundary";

function App() {
  return (
    <ErrorBoundary>
      <SecurityProvider>
        <BrowseRouter />
      </SecurityProvider>
    </ErrorBoundary>
  );
}

export default App;

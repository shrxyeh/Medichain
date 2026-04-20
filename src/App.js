import BrowseRouter from "./BrowseRouter";
import { SecurityProvider } from "./context/SecurityContext";

function App() {
  return (
    <SecurityProvider>
      <BrowseRouter />
    </SecurityProvider>
  );
}

export default App;

import BrowseRouter from "./BrowseRouter";
import { SecurityProvider } from "./context/SecurityContext";

import { library } from "@fortawesome/fontawesome-svg-core";
import {
  faInstagram,
  faFacebookF,
  faLinkedinIn,
} from "@fortawesome/free-brands-svg-icons";

library.add(faInstagram, faFacebookF, faLinkedinIn);

function App() {
  return (
    <SecurityProvider>
      <BrowseRouter />
    </SecurityProvider>
  );
}

export default App;

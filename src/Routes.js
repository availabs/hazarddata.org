
import Auth from "pages/Auth"
import NoMatch from "pages/404"
import DataManager from "pages/DataManager"
import Documentation from "pages/Documentation"
import County from "./pages/County";

const Routes = [
    ...Auth,
  County,
  ...DataManager(),
  ...Documentation,
  NoMatch
]

export default Routes

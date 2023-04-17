
import Auth from "pages/Auth"
import NoMatch from "pages/404"
import DataManager from "pages/DataManager"
import Documentation from "pages/Documentation"
import Geography from "./pages/Geography";
import Disaster from "./pages/Disaster"

const Routes = [
    ...Auth,
  Geography,
  ...Disaster,
  ...DataManager(),
  ...Documentation,
  NoMatch
]

export default Routes

import React, { useMemo } from "react";
import { BrowserRouter, Outlet, Route, Routes, useLocation,   createBrowserRouter, RouterProvider } from "react-router-dom";

import ScrollToTop from "utils/ScrollToTop";
import DefaultRoutes from "Routes";
import Layout from "layout/ppdaf-layout";
import get from "lodash.get";
import {/*getDomain,*/getSubdomain } from "utils";

import {
  ComponentFactory, DefaultLayout, Messages
} from "modules/avl-components/src";

import transportNY from "sites/www";
import Layouts from "./modules/avl-components/src/components/Layouts";


const Sites = {
  "hazardata": transportNY
};

const App = (props) => {

  const SUBDOMAIN = getSubdomain(window.location.host);
  // const PROJECT_HOST = getDomain(window.location.host)

  const site = useMemo(() => {
    return get(Sites, SUBDOMAIN, Sites["hazardata"]);
  }, [SUBDOMAIN]);

  const routes = useMemo(() => {
    return [...site.Routes, ...DefaultRoutes];
  }, [site]);
  console.log(routes)
  return (
    <BrowserRouter basename={process.env.REACT_APP_PUBLIC_URL}>
      <ScrollToTop />
      <Routes>
        {routes.map((route, i) => DefaultLayout({
          site: site.title, layout: Layout, key: i, ...route, ...props, menus: route.mainNav
        }))}
      </Routes>
      <Messages />
    </BrowserRouter>
  );
};

export default App;

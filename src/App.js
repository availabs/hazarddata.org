import React, { useMemo } from "react";
import { BrowserRouter, Routes } from "react-router-dom";

import ScrollToTop from "utils/ScrollToTop";
import DefaultRoutes from "Routes";
import Layout from "layout/ppdaf-layout";
import get from "lodash.get";
import {/*getDomain,*/getSubdomain } from "utils";

import {
  DefaultLayout, Messages
} from "modules/avl-components/src";

import hazmit from "sites/www";


const Sites = {
  "hazardata": hazmit
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
  

  console.log('routes', routes)

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

import React,  {useMemo} from 'react';
import { BrowserRouter, Outlet, Route, Routes, useLocation } from "react-router-dom";

import ScrollToTop from 'utils/ScrollToTop'
import DefaultRoutes from 'Routes';
import Layout from 'layout/ppdaf-layout'
import get from 'lodash.get'
import {/*getDomain,*/getSubdomain} from 'utils'

import {
  ComponentFactory,
  DefaultLayout,
  Messages
} from "modules/avl-components/src";

import transportNY from 'sites/www'
import Layouts from "./modules/avl-components/src/components/Layouts";


const Sites = {
  'hazardata': transportNY,
}

const App = (props) => {

  const SUBDOMAIN = getSubdomain(window.location.host)
  // const PROJECT_HOST = getDomain(window.location.host)

  const site = useMemo(() => {
      return get(Sites, SUBDOMAIN, Sites['hazardata'])
  },[SUBDOMAIN])

  const routes =  useMemo(() => {
    return [...site.Routes, ...DefaultRoutes ]
  }, [site])

  console.log('routes', routes);

  // const route = routes[0];
  // const LayoutWrapper = (props) => {
  //   const
  //     Layout = Layouts.Fixed;
  //   return <Layout { ...route.layoutSettings } { ...route } > <Outlet /> </Layout>
  // }

  // console.log(
  //   <DefaultLayout
  //     site={site.title}
  //     layout={Layout}
  //     key={ 0 }
  //     { ...route }
  //     { ...props }
  //     menus={ route.mainNav }/>
  // )
  return (
    <BrowserRouter basename={process.env.REACT_APP_PUBLIC_URL}>
      <ScrollToTop />
      <Routes>
        {
          routes.map((route, i) => {
            console.log('path', route.path)
            const LayoutWrapper = (props) => {
              const
                Layout = Layouts.Fixed;
              return <Layout { ...route.layoutSettings } { ...route } > <Outlet /> </Layout>
            }
            return (
              <Route key={i} path={ route.path } exact={ route.exact } element={<LayoutWrapper {...route}/>}>
                <Route path={ route.path } exact={ route.exact }  element={<ComponentFactory config={ route.component }/>}/>
              </Route>
            )
          })
        }
        {/*<Route element={<LayoutWrapper {...route}/>}>*/}
        {/*  <Route path={ route.path } exact={ route.exact } element={<ComponentFactory config={ route.component }/>}/>*/}
        {/*</Route>*/}
      </Routes>
      <Messages />
    </BrowserRouter>
  );
}

export default App;

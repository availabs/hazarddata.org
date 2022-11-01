import React,  {useMemo} from 'react';
import { BrowserRouter, Switch } from 'react-router-dom';

import ScrollToTop from 'utils/ScrollToTop'
import DefaultRoutes from 'Routes';
import Layout from 'layout/ppdaf-layout'
import get from 'lodash.get'
import {/*getDomain,*/getSubdomain} from 'utils'

import {
  DefaultLayout,
  Messages
} from "modules/avl-components/src"

import transportNY from 'sites/www'


const Sites = {
  'hazardata': transportNY,
}

const App = (props) => {

  const SUBDOMAIN = getSubdomain(window.location.host)
  // const PROJECT_HOST = getDomain(window.location.host)

  const site = useMemo(() => {
      return get(Sites, SUBDOMAIN, Sites['hazardata'])
  },[SUBDOMAIN])

  const Routes =  useMemo(() => {
    return [...site.Routes, ...DefaultRoutes ]
  }, [site])

  return (
    <BrowserRouter basename={process.env.REACT_APP_PUBLIC_URL}>
      <ScrollToTop />
      {/*<div>{SUBDOMAIN} {site.title} {PROJECT_HOST}</div>*/}
      <Switch>
        { Routes.map((route, i) =>
            <DefaultLayout
              site={site.title}
              layout={Layout}
              key={ i }
              { ...route }
              { ...props }
              menus={ Routes.filter(r => r.mainNav) }/>
          )
        }
      </Switch>
      <Messages />
    </BrowserRouter>
  );
}

export default App;

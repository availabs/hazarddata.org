import React, { useEffect, useMemo, useState } from "react";
import {
  hazardsMeta,
  ctypeColors
} from "../DataManager/DataTypes/constants/colors";
import { useFalcor } from "../../modules/avl-components/src";
import { useSelector } from "react-redux";
import { selectPgEnv } from "../DataManager/store";
import { useParams } from "react-router-dom";
import { AvlMap } from "../../modules/avl-map/src";
import config from 'config.json'
import { HighlightCountyFactory } from './components/highlightCountyLayer';
import { Stats } from "./components/Stats";
import get from "lodash.get";

const County = ({ baseUrl }) => {
  const { geoid } = useParams();
  const { falcor, falcorCache } = useFalcor();
  const [countyView, setCountyView] = useState({source_id: null, view_id: null});
  const pgEnv = useSelector(selectPgEnv);

  const eal_source_id = 229,
    eal_view_id = 511;
  
  const dependencyPath = ['dama', pgEnv, 'viewDependencySubgraphs', 'byViewId', eal_view_id],

    geoNameFilter = JSON.stringify({geoid: [geoid]}),
    geoNameCols = JSON.stringify(['namelsad']),
    geoNameIndices = {from: 0, to: 0},
    geoNamePath    = ({view_id}) => ['dama', pgEnv, 'view', view_id,  "filters", geoNameFilter, geoNameCols, 'byIndex'];

  useEffect(() => {
    falcor.get(
      dependencyPath
    ).then(res => {

      const deps = get(res, ['json', ...dependencyPath, 'dependencies']);
      const countyView = deps.find(d => d.type === 'tl_county');
      
      setCountyView(countyView);

      return falcor.get([...geoNamePath(countyView), geoNameIndices])
    })
  }, [geoid]);

  const map_layers = useMemo(() => {
    return [
      HighlightCountyFactory()
    ]
  },[])
  
  return (
    <div className="max-w-6xl mx-auto p-4 my-1 block">
      <span className={`text-4xl p-5`}>{get(falcorCache, [...geoNamePath(countyView), 0, 'value', 'namelsad'], '')}</span>
      <div className={`flex justify-between place-center`}>
        <div className={`mr-5 shrink w-full`}>
          <Stats hazard={'wildfire'} isTotal={true} geoid={geoid} eal_source_id={eal_source_id} eal_view_id={eal_view_id}/>
        </div>
        <div className={`flex-none h-[200px] w-[300px]`}>
          <AvlMap
            mapbox_logo={false}
            navigationControl={false}
            accessToken={ config.MAPBOX_TOKEN }
            falcor={falcor}
            mapOptions={{
              mapbox_logo: false,
              dragPan: false,
              styles: [
                { name: "Light", style: "mapbox://styles/am3081/ckdfzeg1k0yed1ileckpfnllj" },
              ]
            }}
            layers={map_layers}
            layerProps={{hlc: { geoid, pgEnv }}}
            CustomSidebar={() => <div/>}
          />
        </div>
      </div>

      <div className={`grid grid-cols-6 gap-2 mt-10`}>
        {
          Object.keys(hazardsMeta)
            .sort((a, b) => a.localeCompare(b))
            .map(key => (
              <Stats hazard={key} geoid={geoid} eal_source_id={eal_source_id} eal_view_id={eal_view_id} size={'small'}/>
            ))
        }
      </div>
    </div>
  );
};

const countyConfig = {
  name: "County",
  path: "/county/:geoid",
  exact: false,
  auth: false,
  mainNav: false,
  sideNav: {
    color: "dark",
    size: "none"
  },
  component: County
};

export default countyConfig;
import React, { useMemo, useState } from "react";
import { AvlMap } from "../../../modules/avl-map/src";
import config from "../../../config.json";
import { ChoroplethCountyFactory } from "./choroplethCountyLayer";

export const SimpleMap = ({ disaster_number, geoid, pgEnv, views, falcor, layerProps= {} }) => {
  const [view, setView] = useState(views[0].id);
  const map_layers = useMemo(() => [ ChoroplethCountyFactory() ], []);

  layerProps = useMemo(() =>
    ({ccl: {disaster_number, geoid, view: view || views[0].id, views, pgEnv, ...layerProps}}),
    [view, disaster_number, geoid, views, pgEnv, layerProps]);

  return (
    <div className={"w-full"}>
      <select
        className={'w-full p-2'}
        value={view}
        onChange={e => setView(e.target.value)}
      >
        { views.map(view => <option key={view.id} value={view.id}>{view.label}</option>) }
      </select>

      <div className={`flex-none h-[500px] w-full`}>
        <AvlMap
          mapbox_logo={false}
          navigationControl={false}
          accessToken={config.MAPBOX_TOKEN}
          falcor={falcor}
          mapOptions={{
            // styles: [
            //   // { name: "Light", style: "mapbox://styles/am3081/ckdfzeg1k0yed1ileckpfnllj" }
            // ]
          }}
          layers={map_layers}
          layerProps={layerProps}
          CustomSidebar={() => <div />}
        />
      </div>
    </div>
  );
};
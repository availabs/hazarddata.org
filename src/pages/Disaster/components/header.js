import React, { useEffect, useMemo, useState } from "react";
import { Table, useFalcor } from "../../../modules/avl-components/src";
import { useSelector } from "react-redux";
import { selectPgEnv } from "../../DataManager/store";
import { AvlMap } from "../../../modules/avl-map/src";
import config from "config.json";
import { HighlightCountyFactory } from "../../Geography/components/highlightCountyLayer";
import get from "lodash.get";
import { formatDate } from "../../DataManager/utils/macros";

const RenderMap = ({ falcor, map_layers, layerProps }) => (
  <div className={`flex-none h-[200px] w-[300px]`}>
    <AvlMap
      mapbox_logo={false}
      navigationControl={false}
      accessToken={config.MAPBOX_TOKEN}
      falcor={falcor}
      mapOptions={{
        mapbox_logo: false,
        // dragPan: false,
        styles: [
          { name: "Light", style: "mapbox://styles/am3081/ckdfzeg1k0yed1ileckpfnllj" }
        ]
      }}
      layers={map_layers}
      layerProps={layerProps}
      CustomSidebar={() => <div />}
    />
  </div>
);


export const Header = ({ viewId, disasterNumber, geoid }) => {
  const { falcor, falcorCache } = useFalcor();
  const pgEnv = useSelector(selectPgEnv);
  const
    disasterDetailsAttributes = [
      "disaster_number",
      "declaration_title",
      "declaration_date",
      "incident_type"
    ],
    disasterDetailsOptions = JSON.stringify({
      filter: { disaster_number: [disasterNumber] }
    }),
    disasterDetailsPath = (view_id) => ["dama", pgEnv, "viewsbyId", view_id, "options", disasterDetailsOptions, "databyIndex"];

  useEffect(async () => {
    if(!viewId) return Promise.resolve();
    falcor.get([...disasterDetailsPath(viewId), { from: 0, to: 0 }, disasterDetailsAttributes]);
  }, [disasterNumber, geoid, viewId]);

  const map_layers = useMemo(() => [HighlightCountyFactory()], []);

  const blockLabelClass = `border-b-2`,
        blockValueClass = `font-medium pt-2 text-xl`;

  return (
    <div className={"flex flex-row"}>
      <div className={"w-full shrink-1 flex flex-col mr-5"}>

        <div className={"w-full h-[70px] font-bold flex items-center text-3xl"}>
          {get(falcorCache, [...disasterDetailsPath(viewId), 0, "declaration_title"])}
        </div>

        <div className={"w-full  text-center flex flex-row "}>

          <div className={"w-full h-[90px] bg-white p-3 mt-5 flex flex-col"}>
            <label className={blockLabelClass}>Category</label>
            <span
              className={blockValueClass}>{get(falcorCache, [...disasterDetailsPath(viewId), 0, "incident_type"])}</span>
          </div>

          <div className={"w-full h-[90px] bg-white p-3 mt-5 ml-5 flex flex-col"}>
            <label className={blockLabelClass}>Declaration Date</label>
            <span
              className={blockValueClass}>{formatDate(get(falcorCache, [...disasterDetailsPath(viewId), 0, "declaration_date", "value"], ""))}</span>
          </div>

        </div>
      </div>
      <RenderMap map_layers={map_layers} layerProps={{ hlc: { geoid, pgEnv } }} falcor={falcor} />
    </div>
  );
};
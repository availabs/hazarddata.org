import React, { useEffect, useMemo, useState } from "react";
import {
  hazardsMeta,
  ctypeColors
} from "../DataManager/DataTypes/constants/colors";
import { Table, useFalcor } from "../../modules/avl-components/src";
import { useSelector } from "react-redux";
import { selectPgEnv } from "../DataManager/store";
import { useParams } from "react-router-dom";
import { AvlMap } from "../../modules/avl-map/src";
import config from "config.json";
import { HighlightCountyFactory } from "../Geography/components/highlightCountyLayer";
import get from "lodash.get";
import { BarGraph, PieGraph } from "../../modules/avl-graph/src";
import { fnum, fnumIndex } from "../DataManager/utils/macros";
import { Header } from "./components/header";
import { LossOverviewGrid } from "./components/lossOverviewGrid";

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

const DummyBlock = ({ title, className }) => <div className={className}>{title}</div>
const Disaster = ({ baseUrl }) => {
  const { disasterNumber, geoid } = useParams(); // geoid could be state, county or null
  const [declarationDetails, setDeclarationDetail] = useState({});
  const { falcor, falcorCache } = useFalcor();
  const pgEnv = useSelector(selectPgEnv);

  const ealSourceId = 229,
        ealViewId = 511;

  const dependencyPath = ["dama", pgEnv, "viewDependencySubgraphs", "byViewId", ealViewId];

  const disasterDetailsAttributes = ['distinct disaster_number as disaster_number', 'declaration_title', 'declaration_date', 'incident_type'],
        disasterDetailsOptions = JSON.stringify({
          filter: {disaster_number: [disasterNumber]}
        }),
        disasterDetailsPath = (view_id) => ['dama', pgEnv,  "viewsbyId", view_id, "options"];

  useEffect(async () => {
    falcor.get(dependencyPath).then(async res => {
      const deps = get(res, ["json", ...dependencyPath, "dependencies"]);
      const ihpView = deps.find(d => d.type === "individuals_and_households_program_valid_registrations_v1");
      const paView = deps.find(d => d.type === "public_assistance_funded_projects_details_v1");
      const sbaView = deps.find(d => d.type === "sba_disaster_loan_data_new");
      const nfipView = deps.find(d => d.type === "fima_nfip_claims_v1");
      const usdaView = deps.find(d => d.type === "usda_crop_insurance_cause_of_loss");
      const disasterDeclarationsSummaryView = deps.find(d => d.type === "disaster_declarations_summaries_v2");
      const disasterLossSummaryView = deps.find(d => d.type === "disaster_loss_summary");

    });
  }, [disasterNumber, geoid]);
  const disasterDeclarationsSummaryView =
    get(falcorCache, [...dependencyPath, 'value', 'dependencies'], []).find(dep => dep.type === 'disaster_declarations_summaries_v2');
  const disasterLossSummaryView =
    get(falcorCache, [...dependencyPath, 'value', 'dependencies'], []).find(dep => dep.type === 'disaster_loss_summary');

  return (
    <div className="max-w-6xl mx-auto p-4 my-1 block">
      <Header viewId={disasterDeclarationsSummaryView?.view_id} disasterNumber={disasterNumber} geoid={geoid}/>
      <LossOverviewGrid viewId={disasterLossSummaryView?.view_id} disasterNumbers={disasterNumber} geoid={geoid} />
      <DummyBlock title={'IHP Table'} className={'w-full h-[250px] bg-gray-200 mt-5 text-center align-middle'}/>
      <DummyBlock title={'PA Table'} className={'w-full h-[250px] bg-gray-200 mt-5 text-center align-middle'}/>
      <DummyBlock title={'SBA Table'} className={'w-full h-[250px] bg-gray-200 mt-5 text-center align-middle'}/>
    </div>
  );
};

const disasterConfig = [{
  name: "Disaster",
  path: "/disaster/:disasterNumber",
  exact: false,
  auth: false,
  mainNav: false,
  sideNav: {
    color: "dark",
    size: "none"
  },
  component: Disaster
},
  {
  name: "Disaster",
  path: "/disaster/:disasterNumber/geography/:geoid",
  exact: false,
  auth: false,
  mainNav: false,
  sideNav: {
    color: "dark",
    size: "none"
  },
  component: Disaster
}];

export default disasterConfig;
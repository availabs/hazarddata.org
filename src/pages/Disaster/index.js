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
import { SimpleTable } from "./components/Table";

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

const Disaster = ({ baseUrl }) => {
  const { disasterNumber, geoid } = useParams();
  const { falcor, falcorCache } = useFalcor();
  const pgEnv = useSelector(selectPgEnv);

  const ealViewId = 577;
  const dependencyPath = ["dama", pgEnv, "viewDependencySubgraphs", "byViewId", ealViewId];

  useEffect(async () => {
    falcor.get(dependencyPath);
  }, [disasterNumber, geoid]);

  const disasterDeclarationsSummaryView =
    get(falcorCache, [...dependencyPath, 'value', 'dependencies'], []).find(dep => dep.type === 'disaster_declarations_summaries_v2');
  const disasterLossSummaryView =
    get(falcorCache, [...dependencyPath, 'value', 'dependencies'], []).find(dep => dep.type === 'disaster_loss_summary');
  const ihpView =
    get(falcorCache, [...dependencyPath, 'value', 'dependencies'], []).find(dep => dep.type === 'individuals_and_households_program_valid_registrations_v1');
  const paView =
    get(falcorCache, [...dependencyPath, 'value', 'dependencies'], []).find(dep => dep.type === 'public_assistance_funded_projects_details_v1');
  const sbaView =
    get(falcorCache, [...dependencyPath, 'value', 'dependencies'], []).find(dep => dep.type === 'sba_disaster_loan_data_new');
  const nfipEView =
    get(falcorCache, [...dependencyPath, 'value', 'dependencies'], []).find(dep => dep.type === 'fima_nfip_claims_v1_enhanced');
  const usdaEView =
    get(falcorCache, [...dependencyPath, 'value', 'dependencies'], []).find(dep => dep.type === 'usda_crop_insurance_cause_of_loss_enhanced');

  return (
    <div className="max-w-6xl mx-auto p-4 my-1 block">
      <Header viewId={disasterDeclarationsSummaryView?.view_id} disasterNumber={disasterNumber} geoid={geoid}/>
      <LossOverviewGrid viewId={disasterLossSummaryView?.view_id} disasterNumbers={disasterNumber} geoid={geoid} />
      <div className={'w-full mt-5 align-middle'}>
        <SimpleTable
          title={'IHP Losses'}
          disaster_number={disasterNumber}
          geoid={geoid}
          viewId={ihpView?.view_id}
          ddsViewId={disasterDeclarationsSummaryView?.view_id}
          cols={['disaster_number', 'geoid', 'incident_type', 'rpfvl', 'ppfvl']}
          />
      </div>
      <div className={'w-full mt-5 align-middle'}>
        <SimpleTable
          title={'PA Losses'}
          disaster_number={disasterNumber}
          // geoid={geoid}
          viewId={paView?.view_id}
          ddsViewId={disasterDeclarationsSummaryView?.view_id}
          cols={['disaster_number', 'incident_type', 'project_amount']}
        />
      </div>
      <div className={'w-full mt-5 align-middle'}>
        <SimpleTable
          title={'SBA Losses'}
          disaster_number={disasterNumber}
          geoid={geoid}
          viewId={sbaView?.view_id}
          ddsViewId={disasterDeclarationsSummaryView?.view_id}
          cols={{ 'disaster_number': 'fema_disaster_number', geoid: 'geoid', total_verified_loss: 'total_verified_loss'}}
        />
      </div>
      <div className={'w-full mt-5 align-middle'}>
        <SimpleTable
          title={'NFIP Losses'}
          disaster_number={disasterNumber}
          geoid={geoid}
          viewId={nfipEView?.view_id}
          ddsViewId={disasterDeclarationsSummaryView?.view_id}
          cols={{ 'disaster_number':'disaster_number', geoid: 'geoid', total_amount_paid: 'total_amount_paid'}}
        />
      </div>
      <div className={'w-full h-[250px] mt-5 align-middle'}>
        <SimpleTable
          title={'USDA Losses'}
          disaster_number={disasterNumber}
          geoid={geoid}
          viewId={usdaEView?.view_id}
          ddsViewId={disasterDeclarationsSummaryView?.view_id}
          cols={{ 'disaster_number':'disaster_number', geoid: 'geoid', indemnity_amount: 'indemnity_amount'}}
        />
      </div>
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
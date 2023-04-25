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
import get from "lodash.get";
import { Header } from "./components/header";
import { LossOverviewGrid } from "./components/lossOverviewGrid";
import { SimpleTable } from "./components/SimpleTable";
import { SimpleMap } from "./components/SimpleMap";
import { ChoroplethCountyFactory } from "./components/choroplethCountyLayer";

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
          viewId={ihpView?.view_id}
          attributes={['geoid', 'incident_type', 'rpfvl', 'ppfvl']}
          options={{
            filter: {
              ...disasterNumber && {"disaster_number": [disasterNumber]},
              ...geoid && {[`substring(geoid, 1, ${geoid.length})`]: [geoid]}}
          }}
          />
      </div>
      <div className={'w-full mt-5 align-middle'}>
        <SimpleTable
          title={'PA Losses'}
          disaster_number={disasterNumber}
          viewId={paView?.view_id}
          attributes={{
            geoid: `lpad(state_number_code::text, 2, '0') || lpad(county_code::text, 3, '0') as geoid`,
            incident_type: 'incident_type',
            project_amount: 'project_amount'
          }}
          options={{
            filter: {
              ...disasterNumber && {"disaster_number": [disasterNumber]},
              ...geoid && {[`substring(lpad(state_number_code::text, 2, '0') || lpad(county_code::text, 3, '0'), 1, ${geoid.length})`]: [geoid]}}
          }}
        />
      </div>
      <div className={'w-full mt-5 align-middle'}>
        <SimpleTable
          title={'SBA Losses'}
          disaster_number={disasterNumber}
          viewId={sbaView?.view_id}
          attributes={{
            'Geoid': 'geoid',
            'County / Parish': 'damaged_property_county_or_parish_name',
            'City': 'damaged_property_city_name',
            'Loan Type': 'loan_type',
            'Total Verified Loss': 'total_verified_loss'
          }}
          options={{
            filter: {
              ...disasterNumber && {"fema_disaster_number": [disasterNumber]},
              ...geoid && {[`substring(geoid, 1, ${geoid.length})`]: [geoid]}}
          }}
        />
      </div>
      <div className={'w-full mt-5 align-middle'}>
        <SimpleTable
          title={'NFIP Losses'}
          disaster_number={disasterNumber}
          geoid={geoid}
          viewId={nfipEView?.view_id}
          attributes={{
            'disaster_number':'disaster_number',
            geoid: 'geoid',
            total_amount_paid: 'total_amount_paid'
          }}
          options={{
            filter: {
              ...disasterNumber && {"disaster_number": [disasterNumber]},
              ...geoid && {[`substring(geoid, 1, ${geoid.length})`]: [geoid]}}
          }}
        />
      </div>
      <div className={'w-full mt-5 align-middle'}>
        <SimpleTable
          title={'USDA Losses'}
          disaster_number={disasterNumber}
          geoid={geoid}
          viewId={usdaEView?.view_id}
          attributes={{
            'disaster_number':'disaster_number',
            geoid: 'geoid',
            indemnity_amount: 'indemnity_amount'
          }}
          options={{
            filter: {
              ...disasterNumber && {"disaster_number": [disasterNumber]},
              ...geoid && {[`substring(geoid, 1, ${geoid.length})`]: [geoid]}}
          }}
        />
      </div>

      <div className={'w-full mt-5 align-middle'}>
        <SimpleMap
          disaster_number={disasterNumber}
          geoid={geoid}
          pgEnv={pgEnv}
          views={[
            {
              id: disasterLossSummaryView?.view_id,
              label: 'Total Losses',
              columns: ['ihp_loss', 'pa_loss', 'sba_loss', 'nfip_loss', 'fema_crop_damage'],
              paintFn: (d) => d && +d.ihp_loss + +d.pa_loss + +d.sba_loss + +d.nfip_loss + +d.fema_crop_damage
            },
            {
              id: ihpView?.view_id,
              label: 'IHP Losses',
              columns: ['rpfvl', 'ppfvl'],
              paintFn: (d) => d && d.rpfvl + d.ppfvl
            },
            {
              id: paView?.view_id,
              label: 'PA Losses',
              geoColumn: `lpad(state_number_code::text, 2, '0') || lpad(county_code::text, 3, '0')`,
              columns: ['project_amount']
            },
            {
              id: sbaView?.view_id,
              label: 'SBA Losses',
              disasterNumberColumn: 'fema_disaster_number',
              columns: ['total_verified_loss']
            },
            {
              id: nfipEView?.view_id,
              label: 'NFIP Losses',
              columns: ['total_amount_paid']
            },
            {
              id: usdaEView?.view_id,
              label: 'USDA Losses',
              columns: ['indemnity_amount']
            }
          ]}
          falcor={falcor}
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
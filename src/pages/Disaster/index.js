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
import { fnum } from "../DataManager/utils/macros";

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

const valueFormat = ({ cell, textCols = [], isDollar = false }) => {
  let value = cell?.value?.value?.join(", ") || cell.value || 0;

  return textCols.includes(cell?.column?.Header) ? value : fnum(value, isDollar);
};

const Disaster = ({ baseUrl = 'datasources' }) => {
  const { disasterNumber, geoid } = useParams();
  const { falcor, falcorCache } = useFalcor();
  const pgEnv = useSelector(selectPgEnv);

  const [countyView, setCountyView] = useState();

  const ealViewId = 599;
  const dependencyPath = ["dama", pgEnv, "viewDependencySubgraphs", "byViewId", ealViewId];
  const
    geoNamesOptions = JSON.stringify({
      ...geoid && { filter: { [`substring(geoid, 1, ${geoid?.length})`]: [geoid] } }
    }),
    geoNamesPath = view_id => ["dama", pgEnv, "viewsbyId", view_id, "options", geoNamesOptions];

  useEffect(async () => {
    const deps = await falcor.get(dependencyPath);
    const countyView = get(deps, ["json", ...dependencyPath, "dependencies"]).find(dep => dep.type === "tl_county");
    setCountyView(countyView.view_id);

    const geoNameLenRes = await falcor.get([...geoNamesPath(countyView.view_id), "length"]);
    const geoNameLen = get(geoNameLenRes, ["json", ...geoNamesPath(countyView.view_id), "length"], 0);

    if (geoNameLen) {
      const geoNameRes = await falcor.get([...geoNamesPath(countyView.view_id), "databyIndex", {
        from: 0,
        to: geoNameLen - 1
      }, ["geoid", "namelsad"]]);
    }
  }, [disasterNumber, geoid]);

  const disasterDeclarationsSummaryView =
    get(falcorCache, [...dependencyPath, "value", "dependencies"], []).find(dep => dep.type === "disaster_declarations_summaries_v2");
  const disasterLossSummaryView =
    get(falcorCache, [...dependencyPath, "value", "dependencies"], []).find(dep => dep.type === "disaster_loss_summary");
  const ihpView =
    get(falcorCache, [...dependencyPath, "value", "dependencies"], []).find(dep => dep.type === "individuals_and_households_program_valid_registrations_v1");
  const paView =
    get(falcorCache, [...dependencyPath, "value", "dependencies"], []).find(dep => dep.type === "public_assistance_funded_projects_details_v1");
  const sbaView =
    get(falcorCache, [...dependencyPath, "value", "dependencies"], []).find(dep => dep.type === "sba_disaster_loan_data_new");
  const nfipEView =
    get(falcorCache, [...dependencyPath, "value", "dependencies"], []).find(dep => dep.type === "fima_nfip_claims_v1_enhanced");
  const usdaEView =
    get(falcorCache, [...dependencyPath, "value", "dependencies"], []).find(dep => dep.type === "usda_crop_insurance_cause_of_loss_enhanced");

  const geoNames = Object.values(get(falcorCache, [...geoNamesPath(countyView), "databyIndex"], {}));

  const ihpAttributes = {
      [geoid?.length === 5 ? "Damaged City" : "County"]: geoid?.length === 5 ? "damaged_city" : "county",
      "# Claims": "count(1) as num_claims",
      "Assessed Building Damage": "sum(rpfvl) as rpfvl",
      "Assessed Contents Damage": "sum(ppfvl) as ppfvl",
      "Housing Assistance": "sum(ha_amount) as ha_amount",
      "Total Amount": "sum(ihp_amount) as ihp_amount",
      "Other Needs Assistance": "sum(ona_amount) as ona_amount"
    },
    paAttributes = {
      "County": "county",
      "Damage Category": "damage_category",
      "# Projects": "count(1) as num_projects",
      "Project Amount": "sum(project_amount) as project_amount",
      "Federal Share Obligated": "sum(federal_share_obligated) as federal_share_obligated",
      "Total Obligated": "sum(total_obligated) as total_obligated"
    },
    sbaAttributes = {
      [geoid?.length === 5 ? "City" : "County / Parish"]: geoid?.length === 5 ? "damaged_property_city_name" : "damaged_property_county_or_parish_name",
      "# Loans": "count(1) as num_loans",
      "Verified Loss": "sum(total_verified_loss) as total_verified_loss",
      "Verified Loss Real Estate": "sum(verified_loss_real_estate) as verified_loss_real_estate",
      "Verified Loss Content": "sum(verified_loss_content) as verified_loss_content",
      "Loan Approved Total": "sum(total_approved_loan_amount) as total_approved_loan_amount",
      "Loan Approved Real Estate": "sum(approved_amount_real_estate) as approved_amount_real_estate",
      "Loan Approved Content": "sum(approved_amount_content) as approved_amount_content",
      "Loan approved Economic Injury (EIDL)": "sum(approved_amount_eidl) as approved_amount_eidl"
    },
    nfipAttributes = {
      "County": "geoid",
      "# Claims": "count(1) as num_claims",
      "Amount Paid on Building Claim": "sum(amount_paid_on_building_claim) as amount_paid_on_building_claim",
      "Amount Paid on Contents Claim": "sum(amount_paid_on_contents_claim) as amount_paid_on_contents_claim",
      "Amount Paid on Increased Cost of Compliance": "sum(amount_paid_on_increased_cost_of_compliance_claim) as amount_paid_on_increased_cost_of_compliance_claim",
      "Total Amount Paid": "sum(total_amount_paid) as total_amount_paid"
    },
    usdaAttributes = {
      "County": "county_name",
      "# Claims": "count(1) as num_claims",
      "Commodity Name": "ARRAY_AGG(distinct commodity_name order by commodity_name) as commodity_names",
      "Acres Planted": "sum(net_planted_acres) as net_planted_acres",
      "Acres Lost": "sum(net_determined_acres) as net_determined_acres",
      "Crop Value Lost": "sum(indemnity_amount) as indemnity_amount"
    };

  return (
    <div className="max-w-6xl mx-auto p-4 my-1 block">
      <Header viewId={disasterDeclarationsSummaryView?.view_id} disasterNumber={disasterNumber} geoid={geoid} />
      <LossOverviewGrid viewId={disasterLossSummaryView?.view_id} disasterNumbers={disasterNumber} geoid={geoid} />
      <div className={'w-full mt-5 align-middle'}>
        <SimpleTable
          title={'IHP Losses'}
          disaster_number={disasterNumber}
          viewId={ihpView?.view_id}
          attributes={ihpAttributes}
          baseUrl={baseUrl}
          options={{
            aggregatedLen: true,
            filter: {
              ...disasterNumber && {"disaster_number": [disasterNumber]},
              ...geoid && {[`substring(geoid, 1, ${geoid.length})`]: [geoid]}
            },
            groupBy: [geoid?.length === 5 ? 'damaged_city' : 'county']
          }}
          columns={
            Object.keys(ihpAttributes)
              .map((col, i) => {
                const mappedName = ihpAttributes[col];
                return {
                  Header:  col,
                  accessor: mappedName,
                  Cell: cell => <div>
                    {valueFormat({
                      cell,
                      textCols: ['County', 'Damaged City'],
                      isDollar: !['# Claims'].includes(col)
                    })}
                  </div>,
                  align: ['County', 'Damaged City'].includes(col) ? 'left' : 'right',
                  filter: i === 0 && 'text'
                }
              })
          }
          />
      </div>
      <div className={"w-full mt-5 align-middle"}>
        <SimpleTable
          title={"PA Losses"}
          disaster_number={disasterNumber}
          viewId={paView?.view_id}
          attributes={paAttributes}
          baseUrl={baseUrl}
          options={{
            aggregatedLen: true,
            filter: {
              ...disasterNumber && { "disaster_number": [disasterNumber] },
              ...geoid && { [`substring(lpad(state_number_code::text, 2, '0') || lpad(county_code::text, 3, '0'), 1, ${geoid.length})`]: [geoid] }
            },
            exclude: {
              dcc: ["A", "B", "Z"]
            },
            groupBy: ["county", 'damage_category']
          }}
          columns={
            Object.keys(paAttributes)
              .map((col, i) => {
                const mappedName = paAttributes[col];
                return {
                  Header: col,
                  accessor: mappedName,
                  Cell: cell => <div>
                    {valueFormat({
                      cell,
                      textCols: ["County", "Damage Category"],
                      isDollar: !["# Projects"].includes(col)
                    })}
                  </div>,
                  align: ["County"].includes(col) ? "left" : "right",
                  filter: i === 0 && "text"
                };
              })
          }
        />
      </div>
      <div className={"w-full mt-5 align-middle text-xs"}>
        <SimpleTable
          title={"SBA Losses"}
          disaster_number={disasterNumber}
          viewId={sbaView?.view_id}
          attributes={sbaAttributes}
          baseUrl={baseUrl}
          options={{
            aggregatedLen: true,
            filter: {
              ...disasterNumber && { "fema_disaster_number": [disasterNumber] },
              ...geoid && { [`substring(geoid, 1, ${geoid.length})`]: [geoid] }
            },
            groupBy: [geoid?.length === 5 ? "damaged_property_city_name" : "damaged_property_county_or_parish_name"]
          }}
          columns={
            Object.keys(sbaAttributes)
              .map((col, i) => {
                const mappedName = sbaAttributes[col];
                return {
                  Header: col,
                  accessor: mappedName,
                  Cell: cell => <div className={'text-xs'}>
                    {valueFormat({
                      cell,
                      textCols: ["City", "County / Parish"],
                      isDollar: !["# Loans"].includes(col)
                    })}
                  </div>,
                  align: ["City", "County / Parish"].includes(col) ? "left" : "right",
                  filter: i === 0 && "text"
                };
              })
          }
        />
      </div>
      <div className={"w-full mt-5 align-middle"}>
        <SimpleTable
          title={"NFIP Losses"}
          disaster_number={disasterNumber}
          geoid={geoid}
          viewId={nfipEView?.view_id}
          attributes={nfipAttributes}
          baseUrl={baseUrl}
          options={{
            aggregatedLen: true,
            filter: {
              ...disasterNumber && { "disaster_number": [disasterNumber] },
              ...geoid && { [`substring(geoid, 1, ${geoid.length})`]: [geoid] }
            },
            groupBy: ['geoid']
          }}
          dataModifier={data => {
            data.map(row => {
              row.geoid = geoNames?.find(gn => gn.geoid === row.geoid)?.namelsad || row.geoid;
            })
            return data
          }}
          columns={
            Object.keys(nfipAttributes)
              .map((col, i) => {
                const mappedName = nfipAttributes[col];
                return {
                  Header: col,
                  accessor: mappedName,
                  Cell: cell => <div>
                    {valueFormat({
                      cell,
                      textCols: ["County"],
                      isDollar: !["# Claims"].includes(col)
                    })}
                  </div>,
                  align: ["County"].includes(col) ? "left" : "right",
                  filter: i === 0 && "text"
                };
              })
          }
        />
      </div>
      <div className={"w-full mt-5 align-middle"}>
        <SimpleTable
          title={"USDA Losses"}
          disaster_number={disasterNumber}
          geoid={geoid}
          viewId={usdaEView?.view_id}
          attributes={usdaAttributes}
          baseUrl={baseUrl}
          options={{
            aggregatedLen: true,
            filter: {
              ...disasterNumber && { "disaster_number": [disasterNumber] },
              ...geoid && { [`substring(geoid, 1, ${geoid.length})`]: [geoid] }
            },
            groupBy: ['county_name']
          }}
          columns={
            Object.keys(usdaAttributes)
              .map((col, i) => {
                const mappedName = usdaAttributes[col];
                return {
                  Header: col,
                  accessor: mappedName,
                  Cell: cell => <div>
                    {valueFormat({
                      cell,
                      textCols: ["County", 'Commodity Name'],
                      isDollar: !["# Claims"].includes(col)
                    })}
                  </div>,
                  align: ["County"].includes(col) ? "left" : "right",
                  filter: i === 0 && "text"
                };
              })
          }
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
              columns: {
                'IHP Loss': 'ihp_loss',
                'PA Loss': 'pa_loss',
                'SBA Loss': 'sba_loss',
                'NFIP Loss': 'nfip_loss',
                'USDA Loss': 'fema_crop_damage'
              },
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
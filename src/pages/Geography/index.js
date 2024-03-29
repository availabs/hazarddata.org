import React, { useEffect, useMemo, useState } from "react";
import {
  hazardsMeta,
  ctypeColors
} from "../DataManager/DataTypes/constants/colors";
import { Table, useFalcor } from "../../modules/avl-components/src";
import { useSelector } from "react-redux";
import { selectPgEnv } from "../DataManager/store";
import { Link, useParams } from "react-router-dom";
import { AvlMap } from "../../modules/avl-map/src";
import config from "config.json";
import { HighlightCountyFactory } from "./components/highlightCountyLayer";
import { HazardStatBox } from "./components/HazardStatBox";
import get from "lodash.get";
import { BarGraph, PieGraph } from "../../modules/avl-graph/src";
import { fnum, fnumIndex } from "../DataManager/utils/macros";
import { Search } from "./components/search";
import { DisastersTable } from "./components/disastersTable";
import { HazardStatsGrid } from "./components/HazardStatGrid";
import { scaleLog, scalePow } from "d3-scale";

const colNameMapping = {
  swd_population_damage: 'Population Damage',
  fusion_property_damage: 'Property Damage',
  fusion_crop_damage: 'Crop Damage',
  disaster_number: 'Disaster Number',
  swd_ttd: 'Non Declared Total',
  ofd_ttd: 'Declared Total',
}

const ProcessDataForMap = (data=[], disasterNames) => React.useMemo(() => {
  const years = [...new Set(data.map(d => d.year))].filter(d => +d >= 1996);
  //console.log('years')
  const disaster_numbers = new Set(['Non-declared Disasters']);
  const event_ids = new Set();
  const swdTotal = {swd_tpd: 0, swd_tcd: 0, swd_ttd: 0};
  const ofdTotal = {ofd_tpd: 0, ofd_tcd: 0, ofd_ttd: 0};

  const processed_data = years.map(year => {
    const swdTotalPerYear = {swd_pd: 0, swd_cd: 0, swd_td: 0};
    const ofdTotalPerYear = {ofd_pd: 0, ofd_cd: 0, ofd_td: 0};

    const lossData = data
      .filter(d => d.year === year)
      .reduce((acc, d) => {
        const nri_category = d.nri_category;
        const tmpDn = d.disaster_number === 'SWD' ? 'Non-declared Disasters' :
          get(disasterNames, [d.disaster_number], 'No Title') + ` (${d.disaster_number} - ${nri_category})`;
        const tmpPd = +d.fusion_property_damage || 0,
              tmpCd =  +d.fusion_crop_damage || 0,
              tmptd = tmpPd + tmpCd + (+d.swd_population_damage || 0);

        if(tmpDn.includes('Non-declared Disasters')){
          event_ids.add(tmpDn.split('_')[1]);
          swdTotalPerYear.swd_pd += tmpPd;
          swdTotalPerYear.swd_cd += tmpCd;
          swdTotalPerYear.swd_td += tmptd;

          swdTotal.swd_tpd += tmpPd;
          swdTotal.swd_tcd += tmpCd;
          swdTotal.swd_ttd += tmptd;
        }else{
          disaster_numbers.add(tmpDn);
          ofdTotalPerYear.ofd_pd += tmpPd;
          ofdTotalPerYear.ofd_cd += tmpCd;
          ofdTotalPerYear.ofd_td += tmptd;

          ofdTotal.ofd_tpd += tmpPd;
          ofdTotal.ofd_tcd += tmpCd;
          ofdTotal.ofd_ttd += tmptd;
        }

        return {
          ...acc, ...{
            [`${tmpDn}_pd`]: (acc[[`${tmpDn}_pd`]] || 0) + tmpPd,
            [`${tmpDn}_cd`]: (acc[`${tmpDn}_cd`] || 0) + tmpCd,
            [`${tmpDn}_td`]: (acc[`${tmpDn}_td`] || 0) + tmptd,
            [`${tmpDn}_nri_category`]: nri_category
          }
        };
      }, {});
    return { year, ...lossData, ...swdTotalPerYear, ...ofdTotalPerYear };
  });

  return { processed_data, total: [{...swdTotal, ...ofdTotal, ...{ "year": "Loss Distribution" }}], disaster_numbers: [...disaster_numbers], event_ids: [...event_ids] };
}, [data, disasterNames]);

const HoverComp = ({ data, keys, indexFormat, keyFormat, valueFormat }) => {
  return (
    <div className={`
      flex flex-col px-2 pt-1 rounded bg-white
      ${keys.length <= 1 ? "pb-2" : "pb-1"}`}>
      <div className="font-bold text-lg leading-6 border-b-2 mb-1 pl-2">
        {indexFormat(get(data, "index", null))}
      </div>
      {keys.slice()
        // .filter(k => get(data, ["data", k], 0) > 0)
        .filter(key => data.key === key)
        .reverse().map(key => (
          <div key={key} className={`
            flex items-center px-2 border-2 rounded transition
            ${data.key === key ? "border-current" : "border-transparent"}
          `}>
            <div className="mr-2 rounded-sm color-square w-5 h-5"
                 style={{
                   backgroundColor: get(data, ["barValues", key, "color"], null),
                   opacity: data.key === key ? 1 : 0.2
                 }} />
            <div className="mr-4">
              {keyFormat(key)}:
            </div>
            <div className="text-right flex-1">
              {valueFormat(get(data, ["data", key], 0))}
            </div>
          </div>
        ))
      }
      {keys.length <= 1 ? null :
        <div className="flex pr-2">
          <div className="w-5 mr-2" />
          <div className="mr-4 pl-2">
            Total:
          </div>
          <div className="flex-1 text-right">
            {valueFormat(keys.reduce((a, c) => a + get(data, ["data", c], 0), 0))}
          </div>
        </div>
      }
    </div>
  );
};

const RenderMap = ({ falcor, map_layers, layerProps }) => (
  <div className={`flex-none h-[200px] w-[300px]`}>
    <AvlMap
      mapbox_logo={false}
      navigationControl={false}
      accessToken={config.MAPBOX_TOKEN}
      falcor={falcor}
      mapOptions={{
        dragPan: false,
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

const RenderLegend = () =>
  (
    <div className={"grid grid-cols-9 gap-1 text-sm align-middle"}>
      {
        Object.keys(hazardsMeta)
          .map(key =>
            <div className={"h-full flex"} key={key}>
              <span className={"rounded-full m-1"}
                   style={{
                     height: "15px",
                     width: "15px",
                     backgroundColor: get(hazardsMeta, [key, "color"], "#ccc")
                   }} />
              <label className={"pl-2"}>{hazardsMeta[key].name}</label>
            </div>)
      }
    </div>
  );

const RenderBarChart = ({ chartDataActiveView, disaster_numbers, attributionData, baseUrl }) => (
  <div className={`w-full pt-10 my-1 block flex flex-col`} style={{ height: "450px" }}>
    <label key={"nceiLossesTitle"} className={"text-lg pb-2"}> Loss by Disaster Number
    </label>
    <RenderLegend />
    <BarGraph
      key={"numEvents"}
      data={chartDataActiveView}
      keys={disaster_numbers.map(dn => `${dn}_td`)}
      indexBy={"year"}
      axisBottom={{ tickDensity: 3, axisColor: '#000', axisOpacity: 0 }}
      axisLeft={{
        format: d => fnumIndex(d, 0),
        gridLineOpacity: 0,
        showGridLines: true,
        ticks: 5,
        // tickValues: [5_000_000, 500_000_000, 700_000_000, 10_000_000_000, 20_000_000_000],
        axisColor: '#000',
        axisOpacity: 0
    }}
      paddingInner={0.1}
      colors={(value, ii, d, key) => {
        return key?.split('_')[0] === 'Non-declared Disasters' ? '#be00ff' : get(hazardsMeta, [d[`${key?.split('_')[0]}_nri_category`], 'color'], '#be00ff')
      }}
      hoverComp={{
        HoverComp: HoverComp,
        valueFormat: fnumIndex,
        keyFormat: k => colNameMapping[k] || k.replace('_td', '')
      }}
      groupMode={"stacked"}
    />
    <div className={'text-xs text-gray-700 p-1'}>
      <Link to={`/${baseUrl}/source/${ attributionData?.source_id }/versions/${attributionData?.view_id}`}>
        Attribution: { attributionData?.version }
      </Link>
    </div>
  </div>
);

const RenderPieChart = ({ data }) => {
  const pieColors = {
    ofd_ttd: '#0089ff',
    swd_ttd: '#ff003b'
}
  return (
    <div className={`w-full my-1 block flex flex-col`} style={{ height: "300px" }}>
      <div className={"flex flex-row justify-between justify-stretch pr-5 pt-5"}>
        {
          Object.keys(pieColors)
            .map(key => {

              return (
                <div className={"flex"} key={key}>
                  <div className={"rounded-full"}
                       style={{
                         height: "20px",
                         width: "20px",
                         backgroundColor: pieColors[key]
                       }} />
                  <span className={"pl-2"}>{colNameMapping[key]}</span>
                </div>
              )
            })
        }
      </div>
      <PieGraph
        key={"numEvents"}
        data={data}
        keys={Object.keys(pieColors)}
        colors={Object.values(pieColors)}
        indexBy={"year"}
        axisBottom={d => d}
        axisLeft={{ format: fnumIndex, gridLineOpacity: 1, gridLineColor: "#9d9c9c" }}
        paddingInner={0.1}
        hoverComp={{
          HoverComp: HoverComp,
          valueFormat: fnumIndex,
          keyFormat: k => colNameMapping[k] || k
        }}
        groupMode={"stacked"}
      />
    </div>
  );
};

const RenderStatBoxes = ({ total, numDeclaredEvents, numNonDeclaredEvents }) => {
  const blockClass = `w-full  bg-white p-5 text-center flex flex-col`,
    blockLabelClass = `border-b-2`,
    blockValueClass = `font-medium text-xl pt-2`;
  return (
    <div className={"w-2/3 my-1 grid grid-cols-1 md:grid-cols-2 gap-10 place-content-stretch content-center "}>
      <div className={blockClass}>
        <label className={`${ blockLabelClass } border-blue-300`}>
          # Declared Disasters
        </label>
        <span className={blockValueClass}>
            {fnum(numDeclaredEvents)}
          </span>
      </div>

      <div className={blockClass}>
        <label className={`${ blockLabelClass } border-blue-300`}>
          Declared Loss
        </label>
        <span className={blockValueClass}>
            {fnum(get(total, [0, "ofd_ttd"], 0), true)}
          </span>
      </div>

      <div className={blockClass}>
        <label className={`${ blockLabelClass } border-red-300`}>
          # Non-declared Disasters
        </label>
        <span className={blockValueClass}>
            {fnum(numNonDeclaredEvents)}
          </span>
      </div>

      <div className={blockClass}>
        <label className={`${ blockLabelClass } border-red-300`}>
          Non-declared Loss
        </label>
        <span className={blockValueClass}>
              {fnum(get(total, [0, "swd_ttd"], 0), true)}
          </span>
      </div>

    </div>
  );
}

const Geography = ({ baseUrl = 'datasources' }) => {
  const { geoid = '36' } = useParams();
  const { falcor, falcorCache } = useFalcor();
  const pgEnv = useSelector(selectPgEnv);
  const [disasterDecView, setDisasterDecView] = useState();
  const [disasterNumbers, setDisasterNumbers] = useState([]);

  const ealSourceId = 229,
        ealViewId = 660;
  const fusionSourceId = 336,
        fusionViewId = 657;

  const dependencyPath = ["dama", pgEnv, "viewDependencySubgraphs", "byViewId", ealViewId];
  const disasterNameAttributes = ['distinct disaster_number as disaster_number', 'declaration_title'],
        disasterNamePath = (view_id) =>
          ['dama', pgEnv,  "viewsbyId", view_id,
            "options"];

  const map_layers = useMemo(() => [ HighlightCountyFactory() ], []);

  useEffect(async () => {
    falcor.get(dependencyPath).then(async res => {

      const deps = get(res, ["json", ...dependencyPath, "dependencies"]);
      const fusionView = deps.find(d => d.type === "fusion");
      const lossRes = await falcor.get(
        ["fusion", pgEnv, "source", fusionSourceId, "view", fusionViewId, "byGeoid", geoid, ["lossByYearByDisasterNumber"]],
        ['dama', pgEnv, 'views', 'byId', fusionViewId, 'attributes', ['source_id', 'view_id', 'version']]
      );

      const disasterNumbers = get(lossRes,
        ['json', "fusion", pgEnv, "source", fusionSourceId, "view",
          fusionViewId, "byGeoid", geoid, "lossByYearByDisasterNumber"], [])
        .map(dns => dns.disaster_number)
        .filter(dns => dns !== 'SWD')
        .sort((a, b) => +a - +b);

      if(disasterNumbers.length){
        const ddcView = deps.find(d => d.type === "disaster_declarations_summaries_v2");
        setDisasterNumbers(disasterNumbers);
        setDisasterDecView(ddcView.view_id);
        return falcor.get([...disasterNamePath(ddcView.view_id), JSON.stringify({ filter: { disaster_number: disasterNumbers.sort((a, b) => +a - +b)}}),
          'databyIndex', {from: 0, to: disasterNumbers.length - 1}, disasterNameAttributes]);
      }
    });
  }, [geoid]);

  const disasterNames = Object.values(get(falcorCache, [...disasterNamePath(disasterDecView)], {})).reduce((acc, d) => [...acc, ...Object.values(d?.databyIndex || {})], [])
    .reduce((acc, disaster) => {
      acc[disaster['distinct disaster_number as disaster_number']] = disaster.declaration_title;
      return acc;
    }, {});

  const lossByYearByDisasterNumber = get(falcorCache, ["fusion", pgEnv, "source", fusionSourceId, "view",
    fusionViewId, "byGeoid", geoid, "lossByYearByDisasterNumber", "value"], []),
    { processed_data: chartDataActiveView, disaster_numbers, total } = ProcessDataForMap(lossByYearByDisasterNumber, disasterNames);
  const attributionData = get(falcorCache, ['dama', pgEnv, 'views', 'byId', fusionViewId, 'attributes'], {});

  const numDeclaredEvents = lossByYearByDisasterNumber.filter(d => d.disaster_number !== 'SWD')?.length,
    numNonDeclaredEvents = lossByYearByDisasterNumber.reduce((acc, d) => acc + +(d.disaster_number === 'SWD' ? d.numevents : 0), 0)
  console.log('data?', chartDataActiveView)
  return (
    <div className="max-w-6xl mx-auto p-4 my-1 block">
      <span className={`text-4xl p-5 w-full`}><Search value={geoid} /></span>

      <div className={`flex flex-col sm:flex-row justify-between place-center`}>
        <div className={`mr-5 shrink w-full`}>
          <HazardStatBox isTotal={true} geoid={geoid} eal_source_id={ealSourceId} eal_view_id={ealViewId} />
        </div>
        <RenderMap map_layers={map_layers} layerProps={{ hlc: { geoid: [geoid], pgEnv } }} falcor={falcor} />
      </div>

      <HazardStatsGrid geoid={geoid} eal_source_id={ealSourceId} eal_view_id={ealViewId} baseUrl={baseUrl} />

      <RenderBarChart chartDataActiveView={chartDataActiveView} disaster_numbers={disaster_numbers} attributionData={attributionData} baseUrl={baseUrl}/>

      <div className={`flex flex-row mt-5`}>
        <div className={`w-1/3`}>
          <RenderPieChart data={total} />
        </div>
        <RenderStatBoxes numNonDeclaredEvents={numNonDeclaredEvents} numDeclaredEvents={numDeclaredEvents} total={total} />
      </div>

      <div className={`flex flex-col text-sm w-full`}>
        <DisastersTable type={'declared'} fusionViewId={fusionViewId} geoid={geoid} baseUrl={baseUrl}/>
        <DisastersTable type={'non-declared'} fusionViewId={fusionViewId} geoid={geoid} baseUrl={baseUrl}/>
      </div>

    </div>
  );
};

const countyConfig = [{
  name: "Geography",
  path: "/geography/:geoid",
  exact: false,
  auth: false,
  mainNav: false,
  sideNav: {
    color: "dark",
    size: "none"
  },
  component: Geography
},
{
  name: "Geography",
  path: "/geography/:geoid",
  exact: false,
  auth: false,
  mainNav: false,
  sideNav: {
    color: "dark",
    size: "none"
  },
  component: Geography
},
{
  name: "Geography",
  path: "/geo",
  exact: false,
  auth: false,
  mainNav: false,
  sideNav: {
    color: "dark",
    size: "none"
  },
  component: Geography
}
];

export default countyConfig;
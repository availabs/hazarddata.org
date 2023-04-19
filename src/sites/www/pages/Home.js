import React, { useEffect } from "react";
import {
  hazardsMeta,
  ctypeColors
} from "../../../pages/DataManager/DataTypes/constants/colors";
import { useFalcor } from "../../../modules/avl-components/src";
import { useSelector } from "react-redux";
import { selectPgEnv } from "../../../pages/DataManager/store";
import { Link } from "react-router-dom";
import get from "lodash.get";
import {BarGraph} from "modules/avl-graph/src";
import { Search } from "../../../pages/Geography/components/search";

const hlrSourceId = 218,
  enhancedNCEIhlrSourceId = 198,
  nriSourceId = 159,
  ealSourceId = 229;
const getData = async ({ falcor, pgEnv }) => {


  const ltsViews = ["dama", pgEnv, "sources", "byId", [hlrSourceId, enhancedNCEIhlrSourceId, ealSourceId, nriSourceId], "views", "lts"];
  await falcor.get(ltsViews);

  const falcorCache = falcor.getCache();

  const ltsHlrView = get(falcorCache, ["dama", pgEnv, "sources", "byId", hlrSourceId, "views", "lts", "value"]);
  const ltsEalView = get(falcorCache, ["dama", pgEnv, "sources", "byId", ealSourceId, "views", "lts", "value"]);
  const ltsEnhancedNCEIView = 297; get(falcorCache, ["dama", pgEnv, "sources", "byId", enhancedNCEIhlrSourceId, "views", "lts", "value"]);
  // const ltsEnhancedNCEIView = get(falcorCache, ["dama", pgEnv, "sources", "byId", enhancedNCEIhlrSourceId, "views", "lts", "value"]);


  const sourceData = await falcor.get(
    ["eal", pgEnv, "source", ealSourceId, "view", "lts", "data"],
    ["nri", pgEnv, "source", nriSourceId, "view", "lts", "totals"],
    ["ncei_storm_events_enhanced", pgEnv, "source", enhancedNCEIhlrSourceId, "view", "lts", "lossByYearByType"],

    ["dama", pgEnv, "viewDependencySubgraphs", "byViewId", [ltsHlrView, ltsEalView, ltsEnhancedNCEIView]]
  );

  const tmpSrcIds = [];

  Object.keys(get(sourceData, ["json", "dama", pgEnv, "viewDependencySubgraphs", "byViewId"], {}))
    .forEach(viewId => {
      tmpSrcIds.push(
        ...get(sourceData, ["json", "dama", pgEnv, "viewDependencySubgraphs", "byViewId", viewId, "dependencies"], [])
          .map(d => d.source_id)
          .filter(d => d)
      );
    });

  await falcor.get(["dama", pgEnv, "sources", "byId", tmpSrcIds, "attributes", "type"]);

};

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

const fnumIndex = (d) => {
  if (d >= 1000000000) {
    return `${parseInt(d / 1000000000)} B`;
  } else if (d >= 1000000) {
    return `${parseInt(d / 1000000)} M`;
  } else if (d >= 1000) {
    return `${parseInt(d / 1000)} K`;
  } else {
    return `${d}`;
  }
};

const ReformatNRI = (data = {}) => {
  const formattedData = [];
  Object.keys(data)
    .filter(key => key !== "group_by" && key.includes("_"))
    .forEach(key => {
      const [nri_category, ctype] = key.split("_");
      const tmpExisting = formattedData.find(f => f.nri_category === nri_category);
      if (tmpExisting) {
        tmpExisting[ctype] = data[nri_category];
      } else {
        formattedData.push({ nri_category, [ctype]: data[nri_category] });
      }
    });

  return formattedData.sort((a, b) => a.nri_category.localeCompare(b.nri_category));
};

const ReformatEnhancedNCEI = (data = []) => {
  const formattedData = [];
  const nri_categories = new Set();
  data
    .filter(d => d.year >= 1996)
    .forEach(row => {
      nri_categories.add(row.nri_category);
      const tmpExisting = formattedData.find(f => f.year === row.year);
      if (tmpExisting) {
        tmpExisting[row.nri_category] = parseInt(row.total_damage);
      } else {
        formattedData.push({ year: row.year, [row.nri_category]: parseInt(row.total_damage) });
      }
    });
  return { formattedData, nri_categories: [...nri_categories] };
};

const RenderViewDependencies = ({ dama, srcMeta, viewId, baseUrl }) => (
  get(get(dama, [viewId, "value", "dependencies"], [])
    .find(d => d.view_id === viewId), ["view_dependencies"], [])
    .map(id => {
      const tmpSrcId = get(get(dama, [viewId, "value", "dependencies"], [])
        .find(d => d.view_id === id), "source_id");
      return <Link key={id} to={`${baseUrl}/source/${tmpSrcId}/versions/${id}`}
                   className={"p-2"}>{get(srcMeta, [tmpSrcId, "attributes", "type"], id)}</Link>;
    })
);

const RenderLegend = () =>
  (
    <div className={"flex grid grid-cols-6"}>
      {
        Object.keys(hazardsMeta)
          .map(key =>
            <div className={"mb-1 pb-1 pl-1 flex"} key={key}>
              <div className={"rounded-full"}
                   style={{
                     height: "20px",
                     width: "20px",
                     backgroundColor: get(hazardsMeta, [key, "color"], "#ccc")
                   }} />
              <span className={"pl-2"}>{hazardsMeta[key].name}</span>
            </div>)
      }
    </div>
  );

const Home = ({ baseUrl = "/datasources" }) => {
  const { falcor, falcorCache } = useFalcor();
  const pgEnv = useSelector(selectPgEnv);

  useEffect(() => {
    getData({ falcor, pgEnv });
  }, [pgEnv, falcor]);

  const dama = get(falcorCache, [ "dama", pgEnv, "viewDependencySubgraphs", "byViewId"]),
    enhancedNCEILossLts = get(falcorCache, [ "ncei_storm_events_enhanced", pgEnv, "source", enhancedNCEIhlrSourceId, "view", "lts", "lossByYearByType", "value"], []),
    ealAvailLts = get(falcorCache, [ "eal", pgEnv, "source", ealSourceId, "view", "lts", "data", 'value'], []),
    nriLts = get(falcorCache, [ "nri", pgEnv, "source", nriSourceId, "view", "lts", "totals", 'value', 0], []),

    ltsHlrView = get(falcorCache, ["dama", pgEnv, "sources", "byId", hlrSourceId, "views", "lts", "value"]),
    ltsEalView = get(falcorCache, ["dama", pgEnv, "sources", "byId", ealSourceId, "views", "lts", "value"]),
    // ltsEnhancedNCEIView = get(falcorCache, ["dama", pgEnv, "sources", "byId", enhancedNCEIhlrSourceId, "views", "lts", "value"]),
    ltsEnhancedNCEIView = 297,
    ealAvailLTSViewId = ltsEalView,
    // enhancedNCEILTSViewId = ltsEnhancedNCEIView,
    enhancedNCEILTSViewId = 297,
    srcMeta = get(falcorCache, [ "dama", pgEnv, "sources", "byId"]);

  const reformattedNRILts = ReformatNRI(nriLts);
  const { formattedData: reformattedEnhancedNCEILts, nri_categories } = ReformatEnhancedNCEI(enhancedNCEILossLts);
  const blockClasses = `w-full p-4 my-1 max-w-5xl mx-auto block border flex flex-col`;
  console.log(falcorCache, dama, srcMeta, enhancedNCEILTSViewId)
  return (
    <>
      <div className={blockClasses} style={{ height: "600px" }}>
        <div className={'p-2 text-3xl'}>
          <Search className={'object-fill float-right'}/>
        </div>
        <label key={"nceiLossesTitle"} className={"text-lg"}> NCEI Losses </label>
        <label key={"nceiLossesDeps"} className={"text-sm mb-2"}>using:
          <RenderViewDependencies dama={dama} srcMeta={srcMeta} viewId={enhancedNCEILTSViewId} baseUrl={baseUrl}/></label>
        <RenderLegend />
        <BarGraph
          key={"nceiLosses1"}
          data={reformattedEnhancedNCEILts}
          keys={nri_categories}
          indexBy={"year"}
          axisBottom={d => d}
          axisLeft={{ format: fnumIndex, gridLineOpacity: 1, gridLineColor: "#9d9c9c" }}
          paddingInner={0.05}
          colors={(value, ii, d, key) => get(hazardsMeta, [key, "color"], "#ccc")}
          // hoverComp={{
          //   HoverComp: HoverComp,
          //   valueFormat: fnumIndex,
          //   keyFormat: d => hazardsMeta[d].name
          // }}
        />
      </div>

      <div className={blockClasses} style={{ height: "500px" }}>
        <label key={"ealsAvailTitle"} className={"text-lg"}>EALs (AVAIL) </label>
        <label key={"ealsAvailDeps"} className={"text-sm"}>using:
          <RenderViewDependencies dama={dama} srcMeta={srcMeta} viewId={ealAvailLTSViewId} baseUrl={baseUrl}/></label>
        <BarGraph
          key={"ealsFromEalAvail"}
          data={ealAvailLts}
          keys={["swd_buildings", "swd_crop", "swd_population"]}
          indexBy={"nri_category"}
          axisBottom={d => d}
          axisLeft={{ format: fnumIndex, gridLineOpacity: 1, gridLineColor: "#9d9c9c" }}
          paddingInner={0.05}
          colors={(value, ii, d, key) => ctypeColors[key.split("_")[1]]}
          // hoverComp={{
          //   HoverComp: HoverComp,
          //   valueFormat: fnumIndex
          // }}
        />
      </div>

      <div className={blockClasses} style={{ height: "500px" }}>
        <label key={"ealsNriTitle"} className={"text-lg"}>EALs (NRI) </label>
        <BarGraph
          key={"ealsNri"}
          data={reformattedNRILts}
          keys={["buildings", "crop", "population"]}
          indexBy={"nri_category"}
          axisBottom={d => d}
          axisLeft={{ format: fnumIndex, gridLineOpacity: 1, gridLineColor: "#9d9c9c" }}
          paddingInner={0.05}
          colors={(value, ii, d, key) => ctypeColors[key]}
          // hoverComp={{
          //   HoverComp: HoverComp,
          //   valueFormat: fnumIndex
          // }}
        />
      </div>
    </>
  );
};

const config = {
  name: "",
  // title: 'Transportation Systems Management and Operations (TSMO) System Performance Dashboards',
  // icon: 'fa-duotone fa-home',
  path: "/",
  exact: true,
  auth: false,
  mainNav: false,
  sideNav: {
    color: "dark",
    size: "none"
  },
  component: Home
};

export default config;
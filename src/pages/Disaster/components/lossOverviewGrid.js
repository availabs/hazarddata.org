import React, { useEffect, useMemo, useState } from "react";
import { Table, useFalcor } from "../../../modules/avl-components/src";
import { useSelector } from "react-redux";
import { selectPgEnv } from "../../DataManager/store";
import get from "lodash.get";
import { fnumIndex } from "../../DataManager/utils/macros";


export const LossOverviewGrid = ({ viewId, disasterNumbers, geoid }) => {
  const { falcor, falcorCache } = useFalcor();
  const pgEnv = useSelector(selectPgEnv);
  const
    geoIdCol = geoid?.length === 2 ? "substring(geoid, 1, 2)" : geoid?.length === 5 ? "geoid" : `'all'`,
    disasterDetailsAttributes = {
      disaster_number: "disaster_number",
      geoid: `${geoIdCol} as geoid`,
      fema_property_damage: "sum(fema_property_damage) as fema_property_damage",
      ihp_loss: "sum(ihp_loss) as ihp_loss",
      pa_loss: "sum(pa_loss) as pa_loss",
      sba_loss: "sum(sba_loss) as sba_loss",
      nfip_loss: "sum(nfip_loss) as nfip_loss",
      fema_crop_damage: "sum(fema_crop_damage) as fema_crop_damage"
    },
    disasterDetailsOptions = JSON.stringify({
      filter: geoid ? { disaster_number: [disasterNumbers], [geoIdCol]: [geoid] } : { disaster_number: [disasterNumbers] },
      groupBy: [1, 2]
    }),
    disasterDetailsPath = (view_id) => ["dama", pgEnv, "viewsbyId", view_id, "options", disasterDetailsOptions];

  const blockClass = `w-full h-[90px] bg-white p-5 text-center flex flex-col`,
        blockLabelClass = `border-b-2`,
        blockValueClass = `font-medium text-xl pt-2`
  useEffect(async () => {
    if (!viewId) return Promise.resolve();

    return falcor.get([...disasterDetailsPath(viewId), "databyIndex", { from: 0, to: 0 }, Object.values(disasterDetailsAttributes)]);

  }, [disasterNumbers, geoid, viewId]);
  
  return (
    <div className={"w-full grid grid-cols-6 gap-4 place-content-stretch mt-5"}>
      <div className={blockClass}>
        <label className={blockLabelClass}>Total Loss</label>
        <span className={blockValueClass}>{
          fnumIndex(get(falcorCache, [...disasterDetailsPath(viewId), "databyIndex", 0, disasterDetailsAttributes.fema_property_damage], 0) +
          get(falcorCache, [...disasterDetailsPath(viewId), "databyIndex", 0, disasterDetailsAttributes.fema_crop_damage], 0))
        }</span>
      </div>
      <div className={blockClass}>
        <label className={blockLabelClass}>IHP Loss</label>
        <span className={blockValueClass}>{
          fnumIndex(get(falcorCache, [...disasterDetailsPath(viewId), "databyIndex", 0, disasterDetailsAttributes.ihp_loss], 0))
        }</span>
      </div>
      <div className={blockClass}>
        <label className={blockLabelClass}>PA Loss</label>
        <span className={blockValueClass}>{
          fnumIndex(get(falcorCache, [...disasterDetailsPath(viewId), "databyIndex", 0, disasterDetailsAttributes.pa_loss], 0))
        }</span>
      </div>
      <div className={blockClass}>
        <label className={blockLabelClass}>SBA Loss</label>
        <span className={blockValueClass}>{
          fnumIndex(get(falcorCache, [...disasterDetailsPath(viewId), "databyIndex", 0, disasterDetailsAttributes.sba_loss], 0))
        }</span>
      </div>
      <div className={blockClass}>
        <label className={blockLabelClass}>NFIP Loss</label>
        <span className={blockValueClass}>{
          fnumIndex(get(falcorCache, [...disasterDetailsPath(viewId), "databyIndex", 0, disasterDetailsAttributes.nfip_loss], 0))
        }</span>
      </div>
      <div className={blockClass}>
        <label className={blockLabelClass}>USDA Loss</label>
        <span className={blockValueClass}>{
          fnumIndex(get(falcorCache, [...disasterDetailsPath(viewId), "databyIndex", 0, disasterDetailsAttributes.fema_crop_damage], 0))
        }</span>
      </div>
    </div>
  );
};
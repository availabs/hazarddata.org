import React, { useEffect, useState } from "react";
import get from 'lodash.get';
import { getColorRange, Table, useFalcor } from "../../../modules/avl-components/src";
import { useSelector } from 'react-redux';
import { selectPgEnv } from '../../DataManager/store';
import { RenderSvgBar } from './svgBar';
import {
  hazardsMeta,
  ctypeColors
} from '../../DataManager/DataTypes/constants/colors';
import { fnum, fnumIndex } from "../../DataManager/utils/macros";
import { useParams } from "react-router-dom";

const colNameMapping = {
  swd_population_damage: 'Population Damage',
  fusion_property_damage: 'Property Damage',
  fusion_crop_damage: 'Crop Damage',
  total_fusion_damage: 'Total Fusion Damage',
  disaster_number: 'Disaster Number',
  event_id: 'Event Id',
  swd_ttd: 'Non Declared Total',
  ofd_ttd: 'Declared Total',
  geoid: 'Geoid',
  year: 'Year'
}

export const DisastersTable = ({
  type= 'non-declared',
  fusionViewId = 506,
  geoid = '36001'
                               }) => {
  const { falcor, falcorCache } = useFalcor();
  const pgEnv = useSelector(selectPgEnv);

  const fusionGeoCol = `substring(geoid, 1, ${geoid.length})`,
    fusionAttributes = [
      `${fusionGeoCol} as geoid`,
      'EXTRACT(YEAR from coalesce(fema_incident_begin_date, swd_begin_date)) as year',
      type === 'declared' ? 'disaster_number' : 'event_id',
      'sum(fema_property_damage) as fema_property_damage',
      'sum(fema_crop_damage) as fema_crop_damage',
      'sum(swd_property_damage) as swd_property_damage',
      'sum(swd_crop_damage) as swd_crop_damage',
      'sum(swd_population_damage) as swd_population_damage',
      'sum(fusion_property_damage) as fusion_property_damage',
      'sum(fusion_crop_damage) as fusion_crop_damage',
      'coalesce(sum(fusion_property_damage), 0) + coalesce(sum(fusion_crop_damage), 0) + coalesce(sum(swd_population_damage), 0) as total_fusion_damage'
    ],
    fusionLenOptions =
      JSON.stringify({
        filter: {
          [fusionGeoCol]: [geoid],
          'disaster_number': [type === 'declared' ? 'not null' : 'null']
        },
        groupBy: [fusionGeoCol],
      }),
    fusionOptions =
      JSON.stringify({
        filter: { [fusionGeoCol]: [geoid], 'disaster_number': [type === 'declared' ? 'not null' : 'null'] },
        groupBy: [1, 2, 3],
        orderBy: [
          type === 'declared' ?
            'sum(fema_property_damage)+sum(fema_crop_damage) desc nulls last' :
            'sum(swd_property_damage)+sum(swd_crop_damage)+sum(swd_population_damage) desc nulls last']
      }),
    fusionPath = (view_id) => ["dama", pgEnv, "viewsbyId", view_id, "options"];

  useEffect(async () => {
    const lenRes = await falcor.get([...fusionPath(fusionViewId), fusionLenOptions, 'length']);
    const len = Math.min(get(lenRes, ['json', ...fusionPath(fusionViewId), fusionLenOptions, 'length'], 0), 100),
    fusionIndices = { from: 0, to: len - 1 }

    return falcor.get(
      [...fusionPath(fusionViewId), fusionOptions, 'databyIndex', fusionIndices, fusionAttributes]
    );
  }, [geoid]);

  return (
    <div className={'py-5'}>
      <label key={"nceiLossesTitle"} className={"text-lg capitalize"}> {type} Disasters </label>
      <Table
        columns={
          [fusionAttributes[1], fusionAttributes[2], fusionAttributes[10]].map(col => {
            const mappedName = colNameMapping[col.includes(' as ') ? col.split(' as ')[1] : col] || col;
            return {
              Header:  mappedName,
              accessor: (c) => ['Year', 'Disaster Number', 'Event Id'].includes(mappedName) ? c[col] : fnum(c[col]),
              Cell: cell => typeof cell.value === "object" ? 0 : cell.value || 0,
              align: 'left',
              disableFilters: !['Year', 'Disaster Number', 'Event Id'].includes(mappedName)
            }
          })
        }
        data={
        Object.values(get(falcorCache, [...fusionPath(fusionViewId), fusionOptions, 'databyIndex'], {}))
          .filter(a => typeof a[fusionAttributes[1]] !== 'object')
          // .sort((a,b) => +b.year - +a.year)
      }
        sortBy={'Year'}
        pageSize={5}
      />
    </div>
  )
}
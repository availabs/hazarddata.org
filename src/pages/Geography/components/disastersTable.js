import React, { useEffect, useState } from "react";
import get from 'lodash.get';
import { Table, useFalcor } from "../../../modules/avl-components/src";
import { useSelector } from 'react-redux';
import { selectPgEnv } from '../../DataManager/store';
import { fnum } from "../../DataManager/utils/macros";
import { Link } from "react-router-dom";

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

const colAccessNameMapping = {
  'disaster_number': 'distinct disaster_number as disaster_number'
}
export const DisastersTable = ({
  type= 'non-declared',
  fusionViewId,
  geoid
                               }) => {
  const { falcor, falcorCache } = useFalcor();
  const pgEnv = useSelector(selectPgEnv);
  const [disasterDecView, setDisasterDecView] = useState();
  const [disasterNumbers, setDisasterNumbers] = useState([]);

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

  const dependencyPath = ["dama", pgEnv, "viewDependencySubgraphs", "byViewId", fusionViewId];

  const disasterNameAttributes = ['distinct disaster_number as disaster_number', 'declaration_title'],
    disasterNamePath = (view_id, disasterNumbers) =>
    ['dama', pgEnv,  "viewsbyId", view_id,
    "options", JSON.stringify({ filter: { disaster_number: disasterNumbers}}),
    'databyIndex']

  useEffect(async () => {
    const lenRes = await falcor.get([...fusionPath(fusionViewId), fusionLenOptions, 'length']);
    const len = Math.min(get(lenRes, ['json', ...fusionPath(fusionViewId), fusionLenOptions, 'length'], 0), 100),
          fusionIndices = { from: 0, to: len - 1 }

    const res = await falcor.get(
      dependencyPath,
      [...fusionPath(fusionViewId), fusionOptions, 'databyIndex', fusionIndices, fusionAttributes]
    );

    const disasterNumbers = [...new Set(Object.values(get(res, ['json', ...fusionPath(fusionViewId), fusionOptions, 'databyIndex'], {}))
      .map(d => d.disaster_number)
      .filter(d => d))];

    if(disasterNumbers.length){
      const deps = get(res, ["json", ...dependencyPath, "dependencies"], []).find(d => d.type === "disaster_declarations_summaries_v2");
      setDisasterNumbers(disasterNumbers);
      setDisasterDecView(deps.view_id);
      await falcor.get([...disasterNamePath(deps.view_id, disasterNumbers), {from: 0, to: disasterNumbers.length - 1}, disasterNameAttributes]);
    }

  }, [geoid]);

  const disasterNames = Object.values(get(falcorCache, [...disasterNamePath(disasterDecView, disasterNumbers)], {}));

  return (
    <div className={'py-5'}>
      <label key={"nceiLossesTitle"} className={"text-lg capitalize"}> {type} Disasters </label>
      <Table
        columns={
          [fusionAttributes[1], fusionAttributes[2], fusionAttributes[10]].map(col => {
            const mappedName = colNameMapping[col.includes(' as ') ? col.split(' as ')[1] : col] || col;
            return {
              Header:  mappedName,
              accessor: col,
              Cell: cell => {
                const value = mappedName === 'Disaster Number' ?
                  get(disasterNames.find(dns => dns[colAccessNameMapping.disaster_number] === cell.value),
                    'declaration_title', 'No Title') + ` (${cell.value})` :
                  ['Year', 'Event Id'].includes(mappedName) ? cell.value : fnum(cell.value)
                return mappedName === "Disaster Number" ?
                  <Link to={`/disaster/${cell.row.original.disaster_number}/geography/${geoid}`}>
                    {value}
                  </Link> :
                  <div>
                    {value}
                  </div>;
              },
              align: 'left',
              filter: mappedName === 'Disaster Number' && 'text'
            }
          })
        }
        data={
        Object.values(get(falcorCache, [...fusionPath(fusionViewId), fusionOptions, 'databyIndex'], {}))
              .filter(a => typeof a[fusionAttributes[1]] !== 'object')
      }
        sortBy={fusionAttributes[10]}
        sortOrder={'desc'}
        pageSize={5}
        striped={true}
      />
    </div>
  )
}
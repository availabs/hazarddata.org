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
  total_fusion_damage: 'Total Loss',
  disaster_number: 'Disaster Number',
  event_id: 'Event Id',
  nri_category: 'Hazard Type',
  swd_ttd: 'Non Declared Total',
  ofd_ttd: 'Declared Total',
  geoid: 'Geoid',
  year: 'Year'
}

const colAccessNameMapping = {
  'disaster_number': 'distinct disaster_number as disaster_number',
}

const mapColName = col => colNameMapping[col.includes(' as ') ? col.split(' as ')[1] : col] || col;

export const DisastersTable = ({
  type= 'non-declared',
  fusionViewId,
  geoid,
  baseUrl = '/'
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
      'coalesce(sum(fusion_property_damage), 0) + coalesce(sum(fusion_crop_damage), 0) + coalesce(sum(swd_population_damage), 0) as total_fusion_damage',
      'ARRAY_AGG(distinct nri_category order by nri_category) as nri_category'
    ],
    fusionLenOptions =
      JSON.stringify({
        aggregatedLen: true,
        filter: {
          [fusionGeoCol]: [geoid],
          'disaster_number': [type === 'declared' ? 'not null' : 'null']
        },
        groupBy: [fusionGeoCol, 'EXTRACT(YEAR from coalesce(fema_incident_begin_date, swd_begin_date))', type === 'declared' ? 'disaster_number' : 'event_id',],
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
    const len = Math.min(get(lenRes, ['json', ...fusionPath(fusionViewId), fusionLenOptions, 'length'], 0), 1000),
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
      await falcor.get(
        [...disasterNamePath(deps.view_id, disasterNumbers), {from: 0, to: disasterNumbers.length - 1}, disasterNameAttributes],
        ['dama', pgEnv, 'views', 'byId', fusionViewId, 'attributes', ['source_id', 'view_id', 'version']]
      );
    }

  }, [geoid]);

  const disasterNames = Object.values(get(falcorCache, [...disasterNamePath(disasterDecView, disasterNumbers)], {}));
  const attributionData = get(falcorCache, ['dama', pgEnv, 'views', 'byId', fusionViewId, 'attributes'], {});

  return (
    <>
      <div className={'py-5'}>
        <label key={"nceiLossesTitle"} className={"text-lg capitalize"}> {type} Disasters </label>
        <Table
          columns={
            [fusionAttributes[1], fusionAttributes[2],  fusionAttributes[11],
              fusionAttributes[8], fusionAttributes[9], fusionAttributes[7], fusionAttributes[10]].map(col => {
              const mappedName = mapColName(col);
              return {
                Header:  mappedName,
                accessor: column => {
                  return mappedName === "Disaster Number" ?
                    get(disasterNames.find(dns => dns[colAccessNameMapping.disaster_number] === column[col]),
                      "declaration_title", "No Title") + ` (${column[col]})` : column[col];
                },
                Cell: cell => {
                  const value =
                    ['Year', 'Event Id', 'Disaster Number', 'Hazard Type'].includes(mappedName) ?
                      cell?.value?.value?.join(', ') || cell?.value :
                      fnum(cell.value, true)
                  return mappedName === "Disaster Number" ?
                    <Link to={`/disaster/${cell.row.original.disaster_number}/geography/${geoid}`}>
                      {value}
                    </Link> :
                    <div>
                      {value}
                    </div>;
                },
                align: ['Disaster Number', 'Year'].includes(mappedName) ? 'right' : 'left',
                width: mappedName === mapColName(fusionAttributes[1]) ? '10%' :
                  mappedName === mapColName(fusionAttributes[10]) ? '20%' :
                  mappedName === mapColName(fusionAttributes[11]) ? '20%' :
                  mappedName === mapColName(fusionAttributes[2]) ? '40%' :
                    '15%'
                ,
                filter: ['Disaster Number', 'Year'].includes(mappedName) && 'text'
              }
            })
          }
          data={
            Object.values(get(falcorCache, [...fusionPath(fusionViewId), fusionOptions, 'databyIndex'], {}))
              .filter(a => typeof a[fusionAttributes[1]] !== 'object')
          }
          sortBy={mapColName(fusionAttributes[10])}
          sortOrder={'desc'}
          pageSize={5}
          striped={false}
        />
      </div>
      <div className={'text-xs text-gray-700 pl-1'}>
        <Link to={`/${baseUrl}/source/${ attributionData?.source_id }/versions/${attributionData?.view_id}`}>
          Attribution: { attributionData?.version }
        </Link>
      </div>
    </>
  )
}
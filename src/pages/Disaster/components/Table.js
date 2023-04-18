import React, { useEffect, useState } from "react";
import get from 'lodash.get';
import { Table, useFalcor } from "../../../modules/avl-components/src";
import { useSelector } from 'react-redux';
import { selectPgEnv } from '../../DataManager/store';
import { fnum } from "../../DataManager/utils/macros";
import { Link } from "react-router-dom";


export const SimpleTable = ({
  viewId,
  ddsViewId,
  geoid,
  disaster_number,
  cols,
  title = ''
                               }) => {
  const { falcor, falcorCache } = useFalcor();
  const pgEnv = useSelector(selectPgEnv);
  const [disasterDecView, setDisasterDecView] = useState();
  const [disasterNumbers, setDisasterNumbers] = useState([]);
  console.log('props',  viewId,
    ddsViewId,
    geoid,
    disaster_number,
    cols)
  const
    geoCol = geoid ? `substring(geoid, 1, ${geoid.length})` : null,
    disasterNumberCol = Array.isArray(cols) ? 'disaster_number' : cols.disaster_number,
    geoOptions =
      JSON.stringify({
        filter:
          geoCol && disaster_number ?
            { [geoCol]: [geoid], [disasterNumberCol]: [disaster_number] } :
            geoCol ?  { [geoCol]: [geoid] } :
              disaster_number ?  { [disasterNumberCol]: [disaster_number] } : {}
      }),
    geoPath = (view_id) => ["dama", pgEnv, "viewsbyId", view_id, "options"];

  const disasterNameAttributes = ['distinct disaster_number as disaster_number', 'declaration_title'],
    disasterNamePath = (view_id, disasterNumbers) =>
    ['dama', pgEnv,  "viewsbyId", view_id,
    "options", JSON.stringify({ filter: { disaster_number: disasterNumbers}}),
    'databyIndex']

  useEffect(async () => {
    if(!viewId) return Promise.resolve();

    const lenRes = await falcor.get([...geoPath(viewId), geoOptions, 'length']);
    const len = Math.min(get(lenRes, ['json', ...geoPath(viewId), geoOptions, 'length'], 0), 100),
          indices = { from: 0, to: len - 1 }

    const res = await falcor.get(
      [...geoPath(viewId), geoOptions, 'databyIndex', indices, Array.isArray(cols) ? cols : Object.values(cols)]
    );

    const disasterNumbers = [...new Set(Object.values(get(res, ['json', ...geoPath(viewId), geoOptions, 'databyIndex'], {}))
      .map(d => d[Array.isArray(cols) ? 'disaster_number' : cols.disaster_number])
      .filter(d => d))];

    if(disasterNumbers.length && ddsViewId){
      setDisasterNumbers(disasterNumbers);
      setDisasterDecView(ddsViewId);
      await falcor.get([...disasterNamePath(ddsViewId, disasterNumbers), {from: 0, to: disasterNumbers.length - 1}, disasterNameAttributes]);
    }

  }, [geoid, viewId, ddsViewId, disaster_number, cols]);

  const disasterNames = Object.values(get(falcorCache, [...disasterNamePath(disasterDecView, disasterNumbers)], {}));

  const data = Object.values(get(falcorCache, [...geoPath(viewId), geoOptions, 'databyIndex'], {}));
  const columns = (Array.isArray(cols) ? cols : Object.keys(cols))
    .map(col => {
      const mappedName = Array.isArray(cols) ? col : cols[col];
      return {
        Header:  mappedName,
        accessor: (c) => {
          return mappedName.includes("disaster_number") ?
            get(disasterNames.find(dns => dns[disasterNameAttributes[0]] === c[mappedName]),
              "declaration_title", "No Title") + ` (${c[mappedName]})` : (c[col]);
        },
        Cell: cell => {
          return mappedName.includes('disaster_number') ?
            <Link to={`/disaster/${cell.row.original.disaster_number}`}> {cell.value || 0} </Link> :
            <div> {cell.value || 0} </div>;
        },
        align: 'left',
        disableFilters: !['Year', 'Disaster Number', 'Event Id'].includes(mappedName)
      }
    })

  console.log('??',
    data, columns

  )

  return (
    <div className={'py-5 flex flex-col'}>
      <label key={title} className={"text-sm float-left capitalize"}> {title} </label>
      <>
        {
          data.length && columns.length && (
            <Table
              columns={columns}
              data={data}
              sortBy={'Year'}
              pageSize={5}
            />
          )
        }
        </>
    </div>
  )
}
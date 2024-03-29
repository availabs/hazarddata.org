import React, { useEffect, useState } from "react";
import get from 'lodash.get';
import { Table, useFalcor } from "../../../modules/avl-components/src";
import { useSelector } from 'react-redux';
import { selectPgEnv } from '../../DataManager/store';
import { fnum, formatDate } from "../../DataManager/utils/macros";
import { Link } from "react-router-dom";


export const SimpleTable = ({
  viewId,
  attribution = true,
  baseUrl = '/',
  geoid,
  disaster_number,
  dataModifier,
  columns,
  attributes,
  options,
  title = '',
  striped = false
                               }) => {
  const { falcor, falcorCache } = useFalcor();
  const pgEnv = useSelector(selectPgEnv);
  const [loading, setLoading] = useState(false);

  const geoOptions = JSON.stringify(options),
    geoPath = (view_id) => ["dama", pgEnv, "viewsbyId", view_id, "options"];

  const attributionPath = ['dama', pgEnv, 'views', 'byId', viewId, 'attributes', ['source_id', 'view_id', 'version', '_modified_timestamp']];

  useEffect(async () => {
    if(!viewId) return Promise.resolve();
    setLoading(true)

    const lenRes = await falcor.get([...geoPath(viewId), geoOptions, 'length']);
    const len = Math.min(get(lenRes, ['json', ...geoPath(viewId), geoOptions, 'length'], 0), 100),
          indices = { from: 0, to: len - 1 };
    if(!len) setLoading(false);

    await falcor.get(
      [...geoPath(viewId), geoOptions, 'databyIndex', indices, Array.isArray(attributes) ? attributes : Object.values(attributes)],
      attributionPath
    );

    setLoading(false);

  }, [geoid, viewId, disaster_number, attributes]);

  const attributionData = get(falcorCache, ['dama', pgEnv, 'views', 'byId', viewId, 'attributes'], {});

  let data = Object.values(get(falcorCache, [...geoPath(viewId), geoOptions, 'databyIndex'], {}));
  dataModifier && dataModifier(data);

  columns = columns ||
    (Array.isArray(attributes) ? attributes : Object.keys(attributes))
    .map((col, i) => {
      const mappedName = Array.isArray(attributes) ? col : attributes[col];
      return {
        Header:  col.replace(/_/g, ' '),
        accessor: mappedName,
        Cell: cell => <div> {typeof cell.value === 'object' ? cell?.value?.value || '' : cell.value || 0} </div>,
        align: 'left',
        filter: i === 0 && 'text'
      }
    })

  return (
    <div className={'py-5 flex flex-col'}>
      <label key={title} className={"text-sm float-left capitalize"}> {title} </label>
      <>
        {
          data.length > 0 && columns.length > 0 && (
            <Table
              columns={columns}
              data={data}
              sortBy={'Year'}
              pageSize={5}
              striped={striped}
            />
          ) || <div className={'text-center w-full'}>{loading ? 'Loading...' : 'No Data'}</div>
        }
        </>
      <div className={'flex flex-row text-xs text-gray-700 p-1'}>
        <label>Attribution:</label>
        <div className={'flex flex-col pl-1'}>
          <Link to={`/${baseUrl}/source/${ attributionData?.source_id }/versions/${attributionData?.view_id}`}>
            { attributionData?.version } ({formatDate(attributionData?._modified_timestamp?.value)})
          </Link>
        </div>
      </div>
    </div>
  )
}
import React, { useEffect, useState } from "react";
import get from 'lodash.get';
import { Table, useFalcor } from "../../../modules/avl-components/src";
import { useSelector } from 'react-redux';
import { selectPgEnv } from '../../DataManager/store';
import { fnum } from "../../DataManager/utils/macros";
import { Link } from "react-router-dom";


export const SimpleTable = ({
  viewId,
  geoid,
  disaster_number,
  columns,
  attributes,
  options,
  title = '',
  striped = true
                               }) => {
  const { falcor, falcorCache } = useFalcor();
  const pgEnv = useSelector(selectPgEnv);

  const geoOptions = JSON.stringify(options),
    geoPath = (view_id) => ["dama", pgEnv, "viewsbyId", view_id, "options"];

  useEffect(async () => {
    if(!viewId) return Promise.resolve();

    const lenRes = await falcor.get([...geoPath(viewId), geoOptions, 'length']);
    const len = Math.min(get(lenRes, ['json', ...geoPath(viewId), geoOptions, 'length'], 0), 100),
          indices = { from: 0, to: len - 1 }

    const res = await falcor.get(
      [...geoPath(viewId), geoOptions, 'databyIndex', indices, Array.isArray(attributes) ? attributes : Object.values(attributes)]
    );
    

  }, [geoid, viewId, disaster_number, attributes]);

  const data = Object.values(get(falcorCache, [...geoPath(viewId), geoOptions, 'databyIndex'], {}));
  columns = columns ||
    (Array.isArray(attributes) ? attributes : Object.keys(attributes))
    .map((col, i) => {
      const mappedName = Array.isArray(attributes) ? col : attributes[col];
      return {
        Header:  col,
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
          ) || <div className={'text-center w-full'}>No Data</div>
        }
        </>
    </div>
  )
}
import React from 'react';
//import { useFalcor, withAuth } from 'modules/avl-components/src'
import { useParams, useHistory } from 'react-router-dom'
/*import { useSelector } from "react-redux";
import { selectPgEnv } from "pages/DataManager/store"
*/// import { SymbologyControls } from 'pages/DataManager/components/SymbologyControls'




const ViewSelector = ({views}) => {
  const { viewId, sourceId, page } = useParams()
  const history = useHistory()
  
  return (
    <div className='flex flex-1'>
      <div className='py-3.5 px-2 text-sm text-gray-400'>Version : </div>
      <div className='flex-1'>
        <select  
          className="pl-3 pr-4 py-2.5 border border-blue-100 bg-blue-50 w-full bg-white mr-2 flex items-center justify-between text-sm"
          value={viewId}
          onChange={(e) => history.push(`/datasources/source/${sourceId}/${page}/${e.target.value}`)}
        >
          {views
            .sort((a,b) => b.view_id - a.view_id)
            .map((v,i) => (
            <option key={i} className="ml-2  truncate" value={v.view_id}>
              {v.version ? v.version : v.view_id}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}

export default ViewSelector
import React from 'react'


import { checkApiResponse, getDamaApiRoutePrefix } from "../../../utils/DamaControllerApi";
import {useHistory} from "react-router-dom";
import { useSelector } from "react-redux";
import { selectPgEnv } from "../../../store";
const CallServer = async ({rtPfx, baseUrl, source, tigerTable, newVersion, history}) => {
    const url = new URL(
        `${rtPfx}/hazard_mitigation/tigerDownloadAction`
    );

    url.searchParams.append("table_name", tigerTable);
    url.searchParams.append("source_name", source.name);
    url.searchParams.append("existing_source_id", source.source_id);
    url.searchParams.append("version", newVersion);

    const stgLyrDataRes = await fetch(url);

    await checkApiResponse(stgLyrDataRes);

    const resJson = await stgLyrDataRes.json();

    console.log('res', resJson);

    history.push(`${baseUrl}/source/${resJson.payload.source_id}/versions`);
}

const RenderTigerTables= ({value, setValue, domain}) => {
    return (
        <div  className='flex justify-between group'>
            <div  className="flex-1 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500 py-5">Select Type: </dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    <div className='pt-3 pr-8'>
                        <select
                            className='w-full bg-white p-3 flex-1 shadow bg-grey-50 focus:bg-blue-100  border-gray-300'
                            value={value || ''}
                            onChange={e => {
                                setValue(e.target.value)
                            }}>
                            <option value="" disabled >Select your option</option>
                            {domain
                                .map(v =>
                                    <option
                                        key={v}
                                        value={v} className='p-2'>
                                        {v}
                                    </option>)
                            }
                        </select>
                    </div>


                </dd>
            </div>
        </div>
    )
}

const Create = ({ source, newVersion, baseUrl }) => {
    const history = useHistory();
    const pgEnv = useSelector(selectPgEnv);
    const [tigerTable, setTigerTable] = React.useState();

    const rtPfx = getDamaApiRoutePrefix(pgEnv);

    return (
        <div className='w-full'>
            {RenderTigerTables({value: tigerTable, setValue: setTigerTable, domain: ['STATE', 'COUNTY', 'COUSUB', 'TRACT']})}
            <button
                className={`align-right p-2 border-2 border-gray-200`}
                onClick={() =>
                    CallServer({
                        rtPfx, baseUrl, source, tigerTable, newVersion, history})}
                disabled={!tigerTable}
            >
                Add New Source
            </button>
        </div>
    )
}

export default Create
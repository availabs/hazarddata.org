import React from 'react'
import {DAMA_HOST} from "../../../../config";
import {useSelector} from "react-redux";
import {selectPgEnv, selectUserId} from "../../store";
import {useHistory} from "react-router-dom";
import {checkApiResponse, formatDate, newETL, getSrcViews, createNewDataSource, submitViewMeta} from "../utils/utils";


const CallServer = async ({rtPfx, source, history, etlContextId, userId, tigerTable}) => {
    const { name: sourceName, display_name: sourceDisplayName } = source;

    const src = await createNewDataSource(rtPfx, source, `tl_${tigerTable.toLowerCase()}`);
    console.log('src?', src)
    const view = await submitViewMeta({rtPfx, etlContextId, userId, sourceName, src})

    const url = new URL(
        `${rtPfx}/staged-geospatial-dataset/tigerDownloadAction`
    );
    url.searchParams.append("etl_context_id", etlContextId);
    url.searchParams.append("table", tigerTable);
    // url.searchParams.append("table_name", 'tl_cousubs');
    url.searchParams.append("src_id", src.source_id);
    url.searchParams.append("view_id", view.view_id);

    const stgLyrDataRes = await fetch(url);

    await checkApiResponse(stgLyrDataRes);

    console.log('res', stgLyrDataRes.body)
    history.push(`/datasources/source/${src.source_id}`);
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

const Create = ({ source }) => {
    const history = useHistory();
    const [etlContextId, setEtlContextId] = React.useState();
    const [tigerTable, setTigerTable] = React.useState();

    const pgEnv = useSelector(selectPgEnv);
    const userId = useSelector(selectUserId);

    const rtPfx = `${DAMA_HOST}/dama-admin/${pgEnv}`;

    React.useEffect(() => {
        async function fetchData() {
            const etl = await newETL({rtPfx, setEtlContextId});
            setEtlContextId(etl);
        }
        fetchData();
    }, [])

    return (
        <div className='w-full'>
            {RenderTigerTables({value: tigerTable, setValue: setTigerTable, domain: ['COUSUB', 'TRACT']})}
            <button
                onClick={() =>
                    CallServer({
                        rtPfx, source, history, etlContextId, userId, tigerTable})}
                disabled={!tigerTable}
            >
                Add New Source
            </button>
        </div>
    )
}

export default Create
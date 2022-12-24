import React from 'react'
import {DAMA_HOST} from "../../../../config";
import {useSelector} from "react-redux";
import {selectPgEnv, selectUserId} from "../../store";
import {useHistory} from "react-router-dom";
import get from "lodash.get";

import {checkApiResponse, formatDate, newETL, getSrcViews, createNewDataSource, submitViewMeta} from "../utils/utils";

const CallServer = async ({rtPfx, source, history, etlContextId, userId, viewNCEI={}}) => {
    const { name: sourceName, display_name: sourceDisplayName } = source;

    const src = await createNewDataSource(rtPfx, source, "per_basis_swd");
    console.log('calling server?', etlContextId, src)
    const view = await submitViewMeta({
        rtPfx, etlContextId, userId, sourceName, src,
        metadata: {
            ncei_version: viewNCEI.view_id
        }
    })

    const url = new URL(
        `${rtPfx}/staged-geospatial-dataset/pbSWDLoader`
    );
    url.searchParams.append("etl_context_id", etlContextId);
    url.searchParams.append("table_name", 'per_basis_swd');
    url.searchParams.append("src_id", src.source_id);
    url.searchParams.append("view_id", view.view_id);
    url.searchParams.append("ncei_schema", viewNCEI.table_schema);
    url.searchParams.append("ncei_table", viewNCEI.table_name);

    const stgLyrDataRes = await fetch(url);

    await checkApiResponse(stgLyrDataRes);

    console.log('res', await stgLyrDataRes.json())
    history.push(`/datasources/source/${src.source_id}`);
}

const RenderVersions = ({value, setValue, versions, type}) => {
    return (
        <div  className='flex justify-between group'>
            <div  className="flex-1 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500 py-5">Select {type} version: </dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    <div className='pt-3 pr-8'>
                        <select
                            className='w-full bg-white p-3 flex-1 shadow bg-grey-50 focus:bg-blue-100  border-gray-300'
                            value={value || ''}
                            onChange={e => {
                                setValue(e.target.value)
                            }}>
                            <option value="" disabled >Select your option</option>
                            {versions.views
                                .map(v =>
                                    <option
                                        key={v.view_id}
                                        value={v.view_id} className='p-2'>
                                        {get(versions.sources.find(s => s.source_id === v.source_id), 'display_name')}
                                        {` (${v.view_id} ${formatDate(v.last_updated)})`}
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

    // selected views/versions
    const [viewNCEI, setViewNCEI] = React.useState();
    // all versions
    const [versionsNCEI, setVersionsNCEI] = React.useState({sources:[], views: []});

    const pgEnv = useSelector(selectPgEnv);
    const userId = useSelector(selectUserId);

    const rtPfx = `${DAMA_HOST}/dama-admin/${pgEnv}`;

    React.useEffect(() => {
        async function fetchData() {
            const etl = await newETL({rtPfx, setEtlContextId});
            setEtlContextId(etl);
            await getSrcViews({rtPfx, setVersions: setVersionsNCEI, etlContextId: etl, type: 'ncei_storm_events_enhanced'});
        }
        fetchData();
    }, [])

    return (
        <div className='w-full'>
            {RenderVersions({value: viewNCEI, setValue: setViewNCEI, versions: versionsNCEI, type: 'NCEI Storm Events'})}
            <button
                className={`align-right`}
                onClick={() =>
                    CallServer(
                        {rtPfx, source, history, etlContextId, userId,
                            viewNCEI: versionsNCEI.views.find(v => v.view_id == viewNCEI)
                        })}>
                Add New Source
            </button>
        </div>
    )
}

export default Create
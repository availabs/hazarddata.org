import React from 'react'
import {DAMA_HOST} from "../../../../config";
import {useSelector} from "react-redux";
import {selectPgEnv, selectUserId} from "../../store";
import {useHistory} from "react-router-dom";
import get from "lodash.get";

const formatDate = (dateString) => {
    const options = {year: 'numeric', month: '2-digit',day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false}
    return new Date(dateString).toLocaleDateString(undefined, options)
}

async function checkApiResponse(res) {
    if (!res.ok) {
        let errMsg = res.statusText;
        try {
            const { message } = await res.json();
            errMsg = message;
        } catch (err) {
            console.error(err);
        }

        throw new Error(errMsg);
    }
}

const createNewDataSource = async (rtPfx, source) => {
    const { name: sourceName, display_name: sourceDisplayName } = source;
    const res = await fetch(`${rtPfx}/metadata/createNewDataSource`, {
        method: "POST",
        body: JSON.stringify({
            name: sourceName,
            display_name: sourceDisplayName,
            type: "ncei_storm_vents",
        }),
        headers: {
            "Content-Type": "application/json",
        },
    });

    await checkApiResponse(res);

    const newSrcMeta = await res.json();

    return newSrcMeta;
};

async function submitViewMeta({rtPfx, etlContextId, userId, sourceName}) {
    const url = new URL(`${rtPfx}/staged-geospatial-dataset/submitViewMeta`);
    url.searchParams.append("etl_context_id", etlContextId);
    url.searchParams.append("user_id", userId);

    const viewMetadata = {
        data_source_name: sourceName,
        version: 1,
    };

    const res = await fetch(url, {
        method: "POST",
        body: JSON.stringify(viewMetadata),
        headers: {
            "Content-Type": "application/json",
        },
    });

    await checkApiResponse(res);

    const viewMetaRes = await res.json();

    console.log(viewMetaRes);
}

const newETL = async ({rtPfx, setEtlContextId}) => {
    console.log('etlcalled')
    const newEtlCtxRes = await fetch(`${rtPfx}/new-etl-context-id`);
    await checkApiResponse(newEtlCtxRes);

    const _etlCtxId = +(await newEtlCtxRes.text());
    setEtlContextId(_etlCtxId);
    return _etlCtxId
}

const getSrcViews = async ({rtPfx, setVersions, etlContextId, type}) => {
    if(!etlContextId) return {}
    const url = new URL(
        `${rtPfx}/staged-geospatial-dataset/versionSelectorUtils`
    );
    url.searchParams.append("etl_context_id", etlContextId);
    url.searchParams.append("type", type);

    const list = await fetch(url);

    await checkApiResponse(list);

    const {
        sources, views
    } = await list.json();
    setVersions({sources, views})

    return {sources, views}


}
const CallServer = async ({rtPfx, source, history, etlContextId, userId, viewZTC={}, viewCousubs={}, viewTract={}}) => {
    const { name: sourceName, display_name: sourceDisplayName } = source;

    const src = await createNewDataSource(rtPfx, source);
    console.log('calling server?', etlContextId)
    await submitViewMeta({rtPfx, etlContextId, userId, sourceName})

    const url = new URL(
        `${rtPfx}/staged-geospatial-dataset/loadNCEI`
    );
    url.searchParams.append("etl_context_id", etlContextId);
    url.searchParams.append("table_name", 'details');
    // url.searchParams.append("src_id", src.id);
    url.searchParams.append("tract_schema", viewTract.table_schema);
    url.searchParams.append("tract_table", viewTract.table_name);
    url.searchParams.append("ztc_schema", viewZTC.table_schema);
    url.searchParams.append("ztc_table", viewZTC.table_name);
    url.searchParams.append("cousub_schema", viewCousubs.table_schema);
    url.searchParams.append("cousub_table", viewCousubs.table_name);

    const stgLyrDataRes = await fetch(url);

    await checkApiResponse(stgLyrDataRes);

    console.log('res', await stgLyrDataRes.json())
    // history.push(`/datasources/source/${src.id}`);
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
                                        key={v.id}
                                        value={v.id} className='p-2'>
                                        {get(versions.sources.find(s => s.id === v.source_id), 'display_name')}
                                        {` (${v.id} ${formatDate(v.last_updated)})`}
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
    const [viewZTC, setViewZTC] = React.useState();
    const [viewCousubs, setViewCousubs] = React.useState();
    const [viewTract, setViewTract] = React.useState();
    // all versions
    const [versionsZTC, setVersionsZTC] = React.useState({sources:[], views: []});
    const [versionsCousubs, setVersionsCousubs] = React.useState({sources:[], views: []});
    const [versionsTract, setVersionsTract] = React.useState({sources:[], views: []});

    const pgEnv = useSelector(selectPgEnv);
    const userId = useSelector(selectUserId);

    const rtPfx = `${DAMA_HOST}/dama-admin/${pgEnv}`;

    // React.useEffect(() => {
    //     (async () => {
    //         await getSrcViews({rtPfx, source, setVersions, history, setEtlContextId, userId})
    //     })();
    // }, [])

    React.useEffect(() => {
        async function fetchData() {
            const etl = await newETL({rtPfx, setEtlContextId});
            setEtlContextId(etl);
            await getSrcViews({rtPfx, setVersions: setVersionsZTC, etlContextId: etl, type: 'zone_to_county'});
            await getSrcViews({rtPfx, setVersions: setVersionsCousubs, etlContextId: etl, type: 'tl_cousub'});
            await getSrcViews({rtPfx, setVersions: setVersionsTract, etlContextId: etl, type: 'tl_tract'});
        }
        fetchData();
    }, [])

    return (
        <div className='w-full'>
            {RenderVersions({value: viewZTC, setValue: setViewZTC, versions: versionsZTC, type: 'Zone to County'})}
            {RenderVersions({value: viewCousubs, setValue: setViewCousubs, versions: versionsCousubs, type: 'Cousubs'})}
            {RenderVersions({value: viewTract, setValue: setViewTract, versions: versionsTract, type: 'Tracts'})}
            <button
                className={`align-right`}
                onClick={() =>
                    CallServer(
                        {rtPfx, source, history, etlContextId, userId,
                            viewZTC: versionsZTC.views.find(v => v.id == viewZTC),
                            viewCousubs: versionsCousubs.views.find(v => v.id == viewCousubs),
                            viewTract: versionsTract.views.find(v => v.id == viewTract),
                        })}>
                Add New Source
            </button>
        </div>
    )
}

export default Create
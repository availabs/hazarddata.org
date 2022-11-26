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
            type: "ncei_storm_events",
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
const CallServer = async ({rtPfx, source, history, etlContextId, userId}) => {
    const { name: sourceName, display_name: sourceDisplayName } = source;

    const src = await createNewDataSource(rtPfx, source);
    console.log('calling server?', etlContextId)
    await submitViewMeta({rtPfx, etlContextId, userId, sourceName})

    const url = new URL(
        `${rtPfx}/staged-geospatial-dataset/loadNCEI`
    );
    url.searchParams.append("etl_context_id", etlContextId);
    url.searchParams.append("table_name", 'details');
    url.searchParams.append("src_id", src.id);

    const stgLyrDataRes = await fetch(url);

    await checkApiResponse(stgLyrDataRes);

    console.log('res', await stgLyrDataRes.json())
    history.push(`/datasources/source/${src.id}`);
}

const Create = ({ source }) => {
    const history = useHistory();
    const [etlContextId, setEtlContextId] = React.useState();

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
        }
        fetchData();
    }, [])

    return (
        <div className='w-full'>
            <button
                className={`align-right`}
                onClick={() =>
                    CallServer({rtPfx, source, history, etlContextId, userId})}>
                Add New Source
            </button>
        </div>
    )
}

export default Create
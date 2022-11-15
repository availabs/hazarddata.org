import React from 'react'
import {DAMA_HOST} from "../../../../config";
import {useSelector} from "react-redux";
import {selectPgEnv, selectUserId} from "../../store";
import {useHistory} from "react-router-dom";

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
            type: "zone_to_county",
        }),
        headers: {
            "Content-Type": "application/json",
        },
    });

    await checkApiResponse(res);

    const newSrcMeta = await res.json();

    return newSrcMeta;
};

async function submitViewMeta({rtPfx, _etlCtxId, userId, sourceName}) {
    const url = new URL(`${rtPfx}/staged-geospatial-dataset/submitViewMeta`);
    url.searchParams.append("etl_context_id", _etlCtxId);
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

    console.log('view meta', viewMetaRes);
}

const CallServer = async ({rtPfx, source, history, setEtlContextId, userId}) => {
    const { name: sourceName, display_name: sourceDisplayName } = source;

    const newEtlCtxRes = await fetch(`${rtPfx}/new-etl-context-id`);
    await checkApiResponse(newEtlCtxRes);

    const _etlCtxId = +(await newEtlCtxRes.text());
    console.log('??', _etlCtxId)
    setEtlContextId(_etlCtxId);

    const src = await createNewDataSource(rtPfx, source);
    console.log('src?', src)
    await submitViewMeta({rtPfx, _etlCtxId, userId, sourceName})

    const url = new URL(
        `${rtPfx}/staged-geospatial-dataset/csvUploadAction`
    );
    url.searchParams.append("etl_context_id", _etlCtxId);
    url.searchParams.append("table_name", 'zone_to_county');
    url.searchParams.append("src_id", src.id);

    const stgLyrDataRes = await fetch(url);

    await checkApiResponse(stgLyrDataRes);

    console.log('res', stgLyrDataRes.body)
    history.push(`/datasources/source/${src.id}`);
}

const Create = ({ source }) => {
    const history = useHistory();
    const [etlContextId, setEtlContextId] = React.useState();

    const pgEnv = useSelector(selectPgEnv);
    const userId = useSelector(selectUserId);

    const rtPfx = `${DAMA_HOST}/dama-admin/${pgEnv}`;

    return (
        <div className='w-full'>
            <button onClick={() => CallServer({rtPfx, source, history, etlContextId, setEtlContextId, userId})}> Add New Source</button>
        </div>
    )
}

export default Create
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

const CallServer = async (rtPfx) => {

    // const newEtlCtxRes = await fetch(`${rtPfx}/new-etl-context-id`);

    // await checkApiResponse(newEtlCtxRes);

    // const _etlCtxId = await newEtlCtxRes.text();

    // setEtlContextId(_etlCtxId);

    const url = new URL(
        `${rtPfx}/dama/data_source_integrator.testAction`
    );
    // url.searchParams.append("etl_context_id", etlContextId);

    const stgLyrDataRes = await fetch(url);

    await checkApiResponse(stgLyrDataRes);
}

const Create = () => {
    // const [etlContextId, setEtlContextId] = React.useState({pgEnv: 'dama_dev_1'});
    //
    const pgEnv = useSelector(selectPgEnv);
    //
    const rtPfx = `${DAMA_HOST}/dama-admin/${pgEnv}`;

    return (
        <div className='w-full'>
            <button onClick={() => CallServer(rtPfx)}> Add New Source</button>
        </div>
    )
}

export default Create
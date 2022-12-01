import React from 'react'
import {DAMA_HOST} from "../../../../config";
import {useSelector} from "react-redux";
import {selectPgEnv, selectUserId} from "../../store";
import {useHistory} from "react-router-dom";

import {checkApiResponse, formatDate, newETL, getSrcViews, createNewDataSource, submitViewMeta} from "../utils/utils";

const CallServer = async ({rtPfx, source, history, etlContextId, userId}) => {
    const { name: sourceName, display_name: sourceDisplayName } = source;

    const src = await createNewDataSource(rtPfx, source, "ncei_storm_events");
    console.log('calling server?', etlContextId)
    const view = await submitViewMeta(
        {
            rtPfx, etlContextId, userId, sourceName, src
        })

    const url = new URL(
        `${rtPfx}/staged-geospatial-dataset/loadNCEI`
    );
    url.searchParams.append("etl_context_id", etlContextId);
    url.searchParams.append("table_name", 'details');
    url.searchParams.append("src_id", src.source_id);
    url.searchParams.append("view_id", view.view_id);

    const stgLyrDataRes = await fetch(url);

    await checkApiResponse(stgLyrDataRes);

    console.log('res', await stgLyrDataRes.json())
    history.push(`/datasources/source/${src.source_id}`);
}

const Create = ({ source }) => {
    const history = useHistory();
    const [etlContextId, setEtlContextId] = React.useState();

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
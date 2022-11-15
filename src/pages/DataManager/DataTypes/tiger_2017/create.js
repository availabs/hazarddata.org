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

const createNewDataSource = async (rtPfx, source, tigerTable) => {
    const { name: sourceName, display_name: sourceDisplayName } = source;
    const res = await fetch(`${rtPfx}/metadata/createNewDataSource`, {
        method: "POST",
        body: JSON.stringify({
            name: sourceName,
            display_name: sourceDisplayName,
            type: `tl_${tigerTable.toLowerCase()}`,
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

const CallServer = async ({rtPfx, source, history, setEtlContextId, userId, tigerTable}) => {

    const { name: sourceName, display_name: sourceDisplayName } = source;

    const newEtlCtxRes = await fetch(`${rtPfx}/new-etl-context-id`);
    await checkApiResponse(newEtlCtxRes);

    const _etlCtxId = +(await newEtlCtxRes.text());
    console.log('??', _etlCtxId)
    setEtlContextId(_etlCtxId);

    const src = await createNewDataSource(rtPfx, source, tigerTable);
    console.log('src?', src)
    await submitViewMeta({rtPfx, _etlCtxId, userId, sourceName})

    const url = new URL(
        `${rtPfx}/staged-geospatial-dataset/tigerDownloadAction`
    );
    url.searchParams.append("etl_context_id", _etlCtxId);
    url.searchParams.append("table", tigerTable);
    // url.searchParams.append("table_name", 'tl_cousubs');
    url.searchParams.append("src_id", src.id);

    const stgLyrDataRes = await fetch(url);

    await checkApiResponse(stgLyrDataRes);

    console.log('res', stgLyrDataRes.body)
    history.push(`/datasources/source/${src.id}`);
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

    return (
        <div className='w-full'>
            {RenderTigerTables({value: tigerTable, setValue: setTigerTable, domain: ['COUSUB', 'TRACT']})}
            <button
                onClick={() =>
                    CallServer({
                        rtPfx, source, history, etlContextId, setEtlContextId, userId, tigerTable})}
                disabled={!tigerTable}
            >
                Add New Source
            </button>
        </div>
    )
}

export default Create
import React from 'react'
import {DAMA_HOST} from "../../../../config";
import {useSelector} from "react-redux";
import {selectPgEnv, selectUserId} from "../../store";
import {useHistory} from "react-router-dom";
import {checkApiResponse, formatDate, newETL, getSrcViews, createNewDataSource, submitViewMeta} from "../utils/utils";
import get from "lodash.get";

const datasets = [
    // "data_set_fields_v1",
    // "data_sets_v1",
    // "disaster_declarations_summaries_v1",
    "disaster_declarations_summaries_v2",
    // "emergency_management_performance_grants_v1",
    // "fema_regions_v1",
    // "fema_regions_v2",
    // "fema_web_declaration_areas_v1",
    "fema_web_disaster_declarations_v1",
    "fema_web_disaster_summaries_v1",
    // "fima_nfip_claims_v1",
    // "fima_nfip_policies_v1",
    // "hazard_mitigation_assistance_mitigated_properties_v1",
    "hazard_mitigation_assistance_mitigated_properties_v2",
    // "hazard_mitigation_assistance_projects_by_nfip_crs_communities_v1",
    // "hazard_mitigation_assistance_projects_v1",
    "hazard_mitigation_assistance_projects_v2",
    // "hazard_mitigation_grant_program_disaster_summaries_v1",
    // "hazard_mitigation_grant_program_property_acquisitions_v1",
    // "hazard_mitigation_grants_v1",
    // "hazard_mitigation_plan_statuses_v1",
    // "housing_assistance_owners_v1",
    "housing_assistance_owners_v2",
    "housing_assistance_renters_v1",
    // "housing_assistance_renters_v2",
    "individual_assistance_housing_registrants_large_disasters_v1",
    "individuals_and_households_program_valid_registrations_v1",
    // "ipaws_archived_alerts_v1",
    // "mission_assignments_v1",
    // "non_disaster_assistance_firefighter_grants_v1",
    "public_assistance_applicants_v1",
    "public_assistance_funded_projects_details_v1",
    // "public_assistance_funded_projects_summaries_v1",
    // "registration_intake_individuals_household_programs_v1",
    "registration_intake_individuals_household_programs_v2"
]

const RenderDatasets = ({value, setValue, datasets}) => {
    return (
        <div  className='flex justify-between group'>
            <div  className="flex-1 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500 py-5">Select Table: </dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    <div className='pt-3 pr-8'>
                        <select
                            className='w-full bg-white p-3 flex-1 shadow bg-grey-50 focus:bg-blue-100  border-gray-300'
                            value={value || ''}
                            onChange={e => {
                                setValue(e.target.value)
                            }}>
                            <option value="" disabled >Select your option</option>
                            {datasets
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

const CallServer = async ({rtPfx, source, history, etlContextId, userId, table}) => {
    const { name: sourceName, display_name: sourceDisplayName } = source;

    const src = await createNewDataSource(rtPfx, source, table);
    console.log('src?', src)
    const view = await submitViewMeta({rtPfx, etlContextId, userId, sourceName, src})

    const url = new URL(
        `${rtPfx}/staged-geospatial-dataset/openFemaDataLoader`
    );
    url.searchParams.append("etl_context_id", etlContextId);
    url.searchParams.append("table_name", table);
    url.searchParams.append("src_id", src.source_id);
    url.searchParams.append("view_id", view.view_id);

    const stgLyrDataRes = await fetch(url);

    await checkApiResponse(stgLyrDataRes);

    console.log('res', stgLyrDataRes.body)
    history.push(`/datasources/source/${src.source_id}`);
}

const Create = ({ source }) => {
    const history = useHistory();
    const [etlContextId, setEtlContextId] = React.useState();
    const [table, setTable] = React.useState();

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
            {RenderDatasets({value: table, setValue: setTable, datasets})}
            <button onClick={() => CallServer({
                rtPfx, source, history, etlContextId, userId, table
            })}> Add New Source</button>
        </div>
    )
}

export default Create
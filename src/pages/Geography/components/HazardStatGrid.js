import { useFalcor } from "../../../modules/avl-components/src";
import { useSelector } from "react-redux";
import { selectPgEnv } from "../../DataManager/store";
import React, { useEffect } from "react";
import get from "lodash.get";
import { hazardsMeta } from "../../DataManager/DataTypes/constants/colors";
import { HazardStatBox } from "./HazardStatBox";
import { Link } from "react-router-dom";

export const HazardStatsGrid = ({ geoid, eal_source_id, eal_view_id, baseUrl }) => {
  const { falcor, falcorCache } = useFalcor();
  const pgEnv = useSelector(selectPgEnv);

  useEffect(() => {
    falcor.get(['dama', pgEnv, 'views', 'byId', eal_view_id, 'attributes', ['source_id', 'version']])
  })

  const attributionData = get(falcorCache, ['dama', pgEnv, 'views', 'byId', eal_view_id, 'attributes'], {});
  return (
    <div className={'flex flex-col'}>
      <div className={`grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6  gap-2 mt-10`}>
        {
          Object.keys(hazardsMeta)
            .sort((a, b) => a.localeCompare(b))
            .map(key => (
              <HazardStatBox hazard={key} geoid={geoid} eal_source_id={eal_source_id} eal_view_id={eal_view_id}
                             size={"small"} />
            ))
        }
      </div>
      <div className={'text-xs text-gray-700 p-1'}>
        <Link to={`/${baseUrl}/source/${ attributionData?.source_id }/versions/${eal_view_id}`}>
          Attribution: { attributionData?.version }
        </Link>
      </div>
    </div>
  );
};
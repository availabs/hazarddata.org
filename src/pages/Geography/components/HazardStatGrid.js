import { useFalcor } from "../../../modules/avl-components/src";
import { useSelector } from "react-redux";
import { selectPgEnv } from "../../DataManager/store";
import React, { useEffect, useState } from "react";
import get from "lodash.get";
import { hazardsMeta } from "../../DataManager/DataTypes/constants/colors";
import { HazardStatBox } from "./HazardStatBox";
import { Link } from "react-router-dom";
import { formatDate } from "../../DataManager/utils/macros";

export const HazardStatsGrid = ({ geoid, eal_source_id, eal_view_id, baseUrl }) => {
  const { falcor, falcorCache } = useFalcor();
  const pgEnv = useSelector(selectPgEnv);
  const [deps, setDeps] = useState([eal_view_id]);

  useEffect(async () => {
    const depsRes = await falcor.get(["dama", pgEnv, "viewDependencySubgraphs", "byViewId", eal_view_id]);

    const deps = get(depsRes, ["json", "dama", pgEnv, "viewDependencySubgraphs", "byViewId", eal_view_id, "dependencies"]);
    const nriView = deps.find(d => d.type === "nri");
    const fusionView = deps.find(d => d.type === "fusion");
    setDeps([eal_view_id, nriView.view_id, fusionView.view_id]);
    falcor.get(
      ['dama', pgEnv, 'views', 'byId',
      [eal_view_id, nriView.view_id, fusionView.view_id],
      'attributes', ['source_id', 'view_id', 'version', '_modified_timestamp']]
    )
  }, [eal_view_id, geoid]);

  const attributionData = view_id => get(falcorCache, ['dama', pgEnv, 'views', 'byId', view_id, 'attributes'], {});
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
      <div className={'flex flex-row text-xs text-gray-700 p-1'}>
        <label>Attribution:</label>
        <div className={'flex flex-col pl-1'}>
          {
            deps.map(d => (
              <Link to={`/${baseUrl}/source/${ attributionData(d)?.source_id }/versions/${d}`}>
                { attributionData(d)?.version } ({formatDate(attributionData(d)?._modified_timestamp?.value)})
              </Link>
            ))
          }
        </div>
      </div>
    </div>
  );
};
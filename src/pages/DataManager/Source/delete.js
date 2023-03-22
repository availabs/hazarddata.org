import { useParams, Link } from "react-router-dom";
import get from "lodash.get";
import { useSelector } from "react-redux";
import { useFalcor } from "modules/avl-components/src";
import { selectPgEnv } from "../store";
import { getDamaApiRoutePrefix, deleteSource } from "../utils/DamaControllerApi";
import { useEffect } from "react";
import SourcesLayout from "../components/SourcesLayout";
import { useHistory } from "react-router-dom";

async function getData({ falcor, pgEnv, sourceId }) {

  const data = await falcor.get(["dama", pgEnv, "sources", "byId", sourceId, "dependents"]);

  // collect all dependency sources, fetch meta for them.
  const tmpSrcIds = [];
  const tmpViewIds = [];

  get(data, ["json", "dama", pgEnv, "sources", "byId", sourceId, "dependents"])
    .forEach(d => {
      tmpSrcIds.push(
        d.source_id
      );
      tmpViewIds.push(
        d.view_id
      );
    });

  await falcor.get(["dama", pgEnv, "sources", "byId", [...tmpSrcIds, sourceId], "attributes", ["type", "name", "display_name"]]);

  await falcor.get(["dama", pgEnv, "views", "byId", tmpViewIds, "attributes", ["version", "metadata", "_modified_timestamp", "last_updated"]]);
}

const DeleteButton = ({ text, sourceId, pgEnv, baseUrl }) => {
  const { falcor } = useFalcor();
  const history = useHistory();

  return (
    <button
      className={"bg-red-50 hover:bg-red-400 hover:text-white p-2"}
      onClick={async () => {
        await deleteSource(`${getDamaApiRoutePrefix(pgEnv)}`, sourceId);
        falcor.invalidate(
          ['dama',pgEnv, 'sources', 'length'],
          ['dama',pgEnv, 'sources', 'byIndex'],
          ['dama',pgEnv, 'sources', 'byId', sourceId],
        )
        history.push(baseUrl);
      }}
    >
      {text}
    </button>
  );
};

const RenderDependents = ({ dependents, srcMeta, viewMeta }) => {
  return (
    <div className="w-full p-4 shadow mb-4">
      <label className={"text-lg"}>Dependents</label>
      <div className="py-4 sm:py-2 mt-2 sm:grid sm:grid-cols-5 sm:gap-20 sm:px-6 border-b-2">
        {
          ["Source Name", "Type", "Version", "Last Updated"]
            .map(key => (
              <dt key={key} className="text-sm font-medium text-gray-600">
                {key}
              </dt>
            ))
        }
      </div>
      <dl className="sm:divide-y sm:divide-gray-200">
        {
          dependents
            .map((d, i) => (
                <div key={`${i}_0`} className="py-4 sm:py-5 sm:grid sm:grid-cols-5 sm:gap-20 sm:px-6">
                  <dd key={`${i}_1`} className="mt-1 text-sm text-gray-900 sm:mt-0 align-middle">
                    <Link to={`/source/${d.source_id}/overview`}>
                      {get(srcMeta, [d.source_id, "attributes", "name"])}
                    </Link>
                  </dd>

                  <dd key={`${i}_2`} className="mt-1 text-sm text-gray-900 sm:mt-0 align-middle">
                    <Link to={`/source/${d.source_id}/overview`}>
                      {get(srcMeta, [d.source_id, "attributes", "type"])}
                    </Link>
                  </dd>

                  <dd key={`${i}_3`} className="mt-1 text-sm text-gray-900 sm:mt-0 align-middle">
                    <Link to={`/source/${d.source_id}/views/${d.view_id}`}>
                      {get(viewMeta, [d.view_id, "attributes", "version"])}
                    </Link>
                  </dd>

                  <dd key={`${i}_4`} className="mt-1 text-sm text-gray-900 sm:mt-0 align-middle">
                    <Link to={`/source/${d.source_id}/views/${d.view_id}`}>
                      {typeof get(viewMeta, [d.view_id, "attributes", "_modified_timestamp", "value"]) === "object" ? "" :
                        get(viewMeta, [d.view_id, "attributes", "_modified_timestamp", "value"])
                      }
                    </Link>
                  </dd>

                  <dd key={`${i}_5`} className="mt-1 text-sm text-red-400 sm:mt-0">
                                        <span className={"float-right italic"}> {
                                          get(viewMeta, [d.view_id, "attributes", "metadata", "value", "authoritative"]) === "true" ? ""
                                            : "outdated"
                                        }</span>
                  </dd>
                </div>

              )
            )
        }
      </dl>

    </div>
  );
};

const LoadDependentViews = (dependents, srcMeta, viewMeta, sourceId, pgEnv, baseUrl) => (
  <>
    <div className={"pb-4 flex justify-between"}>
      <label>The Source has following dependents:</label>

      <DeleteButton text={"Delete anyway"} sourceId={sourceId} pgEnv={pgEnv} baseUrl={baseUrl} />
    </div>

    <div className={"bg-red-50"}>
      <RenderDependents dependents={dependents} srcMeta={srcMeta} viewMeta={viewMeta} />
    </div>
  </>);

const LoadConfirmDelete = (sourceId, pgEnv, baseUrl) => (
  <div className={"pb-4 flex justify-between"}>
    <label>No dependents found.</label>

    <DeleteButton text={"Confirm Delete"} sourceId={sourceId} pgEnv={pgEnv} baseUrl={baseUrl} />
  </div>
);

export default function Popup({ baseUrl }) {
  const { falcor, falcorCache } = useFalcor();
  const { sourceId } = useParams();
  const pgEnv = useSelector(selectPgEnv);

  useEffect(() => {
    getData({ falcor, pgEnv, sourceId });
  }, [sourceId, pgEnv, falcor]);

  const
    dependents = get(falcorCache, ["dama", pgEnv, "sources", "byId", sourceId, "dependents", "value"], []),
    display_name = get(falcorCache, ["dama", pgEnv, "sources", "byId", sourceId, "attributes", "name"], ""),
    srcMeta = get(falcorCache, ["dama", pgEnv, "sources", "byId"], {}),
    viewMeta = get(falcorCache, ["dama", pgEnv, "views", "byId"], {});

  return (
    <div>
      <SourcesLayout baseUrl={baseUrl}>
        <div className="w-full p-4 bg-white my-1 block border shadow">
          <div className={"pb-4 font-bold"}>Delete <i>{display_name}</i></div>
          {dependents.length ? LoadDependentViews(dependents, srcMeta, viewMeta, sourceId, pgEnv, baseUrl) : LoadConfirmDelete(sourceId, pgEnv, baseUrl)}
        </div>
      </SourcesLayout>
    </div>
  );
}
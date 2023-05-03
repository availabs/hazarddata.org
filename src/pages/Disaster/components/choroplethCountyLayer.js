import get from "lodash.get";
import { LayerContainer } from "modules/avl-map/src";
import { length } from "tailwindcss/lib/util/dataTypes";
import { getColorRange } from "../../../modules/avl-components/src";
import { fnum } from "../../DataManager/utils/macros";
import ckmeans from "../../DataManager/utils/ckmeans";
import { scaleThreshold } from "d3-scale";

class EALChoroplethOptions extends LayerContainer {
  constructor(props) {
    super(props);
  }

  name = "ccl";
  id = "ccl";
  data = [];
  sources = [
    {
      id: "states",
      source: {
        "type": "vector",
        "url": "mapbox://am3081.1fysv9an"
      },
    },
    {
      id: "counties",
      source: {
        "type": "vector",
        "url": "mapbox://am3081.a8ndgl5n"
      },
    }
  ];

  layers = [
    {
      "id": "counties",
      "source": "counties",
      "source-layer": "counties",
      "type": "fill",
      "paint": {
        "fill-color": '#8f680f'
      }
    },
    {
      "id": "counties-line",
      "source": "counties",
      "source-layer": "counties",
      "type": "line",
      paint: {
        "line-width": [
          "interpolate",
          ["linear"],
          ["zoom"],
          4, 1,
          22, 1
        ],
        "line-color": "#000000",
        "line-opacity": 0.5
      }
    }
  ];

  legend = {
    Title: '',
    type: "threshold",
    format: "0.2s",
    domain: [0, 25, 50, 75, 100],
    range: getColorRange(5, "RdYlGn", false),
    show: true
  };

  onHover = {
    layers: ["counties"],
    HoverComp: ({ data, layer }) => {
      return (
        <div style={{ maxHeight: "300px" }} className={`rounded relative px-1 overflow-auto scrollbarXsm bg-white`}>
          {
            data?.length && data.map((row, i) =>
              <div key={i} className="flex">
                {
                  row?.length && row.map((d, ii) =>
                    <div key={ii}
                      // style={{maxWidth: '200px'}}
                         className={`
                    ${ii === 0 ? "flex-1 font-bold" : "overflow-auto scrollbarXsm"}
                    ${row.length > 1 && ii === 0 ? "mr-4" : ""}
                    ${row.length === 1 && ii === 0 ? `border-b-2 text-lg ${i > 0 ? "mt-1" : ""}` : ""}
                    `}>
                      {d}
                    </div>
                  )
                }
              </div>
            )
          }
        </div>
      );
    },
    callback: (layerId, features, lngLat) => {
      return features.reduce((a, feature) => {
        let { view, views } = this.props;
        const currentView = views.find(v => v.id.toString() === view.toString());
        const keyMapping = key => Array.isArray(currentView?.columns) ? key : Object.keys(currentView?.columns || {}).find(k => currentView.columns[k] === key);
        let record = this.data.find(d => d.geoid === feature.properties.geoid),
          response = [
            [feature.properties.geoid, ''],
            ...Object.keys(record || {})
              .filter(key => key !== 'geoid')
              .map(key => [keyMapping(key), fnum(get(record, key))]),
            currentView?.paintFn ? ['Total', fnum(currentView.paintFn(record || {}) || 0)] : null
          ];
        return response;
      }, []);
    }
  };

  init(map, falcor, props) {
    map.fitBounds([-125.0011, 24.9493, -66.9326, 49.5904]);
  }

  fetchData(falcor) {

    const {disaster_number, geoid, view, views, pgEnv} = this.props;

    if(!disaster_number || !view) return Promise.resolve();
    this.data = [];
    const eal_view_id = 577;
    const currentView = views.find(v => v.id.toString() === view.toString());
    const columns = Array.isArray(currentView?.columns) ? currentView?.columns : Object.values(currentView?.columns);

    if(!currentView) return Promise.resolve();

    const dependencyPath = ['dama', this.props.pgEnv, 'viewDependencySubgraphs', 'byViewId', eal_view_id],
      geomColName = `substring(${currentView.geoColumn || 'geoid'}, 1, 5)`,
      disasterNumberColName = currentView.disasterNumberColumn || 'disaster_number',
      options = JSON.stringify({
        aggregatedLen: true,
        filter: false && geoid?.length === 5 ? { [disasterNumberColName]: [disaster_number], [geomColName]: [geoid] } : { [disasterNumberColName]: [disaster_number] },
        groupBy: [disasterNumberColName, geomColName]
      }),
      attributes = {
        geoid: `${geomColName} as geoid`,
        ...(columns || [])
          .reduce((acc, curr) => ({...acc, [curr]: `sum(${curr}) as ${curr}`}) , {})
      },
      path = ['dama', pgEnv, 'viewsbyId', view, 'options', options]

    return falcor.get([...path, 'length'], dependencyPath)
      .then(async res => {

        const geomDep = get(res, ['json', ...dependencyPath, 'dependencies'], [])
                          .find(d => d.type === (false && geoid?.length === 5 ? 'tl_county' : 'tl_state'));
        const len = get(res, ['json', ...path, 'length']);

       await len && falcor.get([...path, 'databyIndex', {from:0, to:len - 1}, Object.values(attributes)])
              .then(async res => {
                let data = Object.values(get(res, ['json', ...path, 'databyIndex'], {}));
                data = [...Array(len).keys()].map(i => {
                  return Object.keys(attributes).reduce((acc, curr) => ({...acc, [curr]: data[i][attributes[curr]]}) ,{});
                });
                this.data = data;

                console.log('d?', data, this.data)
                if(!data?.length) return Promise.resolve();

                const geomColTransform = [`st_asgeojson(st_envelope(ST_Simplify(geom, ${false && geoid?.length ===  5 ? `0.1` : `0.5`})), 9, 1) as geom`],
                  geoIndices = {from: 0, to: 0},
                  stateFips = get(data, [0, 'geoid']) || this.props.geoid?.substring(0, 2),
                  geoPath    = ({view_id}) =>
                    ['dama', this.props.pgEnv, 'viewsbyId', view_id,
                      'options', JSON.stringify({ filter: { geoid: [false && geoid?.length === 5 ? geoid : stateFips.substring(0, 2)]}}),
                      'databyIndex'
                    ];
                console.log('geo p', geoPath(geomDep))
                const geomRes = await falcor.get([...geoPath(geomDep), geoIndices, geomColTransform]);
                const geom = get(geomRes, ["json", ...geoPath(geomDep), 0, geomColTransform]);
                console.log('geom', get(JSON.parse(geom), 'bbox'))
                if(geom){
                  this.mapFocus = get(JSON.parse(geom), 'bbox');
                }
              })
      })
  }

  handleMapFocus(map) {
    console.log('mf?', this.mapFocus)
    if (this.mapFocus) {
      try {
          map.fitBounds(this.mapFocus)
      } catch (e) {
        map.fitBounds([-125.0011, 24.9493, -66.9326, 49.5904]);
      }
    } else {
    map.fitBounds([-125.0011, 24.9493, -66.9326, 49.5904]);
    }
  }

  getColorScale(domain) {
    if(!domain.length) domain = [0, 25, 50, 75, 100];


    this.legend.range = getColorRange(9, "Oranges", false)

    this.legend.domain = ckmeans(domain,Math.min(domain.length,this.legend.range.length)).map(d => parseInt(d))

    return scaleThreshold()
      .domain(this.legend.domain)
      .range(this.legend.range);
  }

  paintMap(map) {
    let { geoid, view, views } = this.props
    const currentView = views.find(v => v.id?.toString() === view?.toString());
    const columns = Array.isArray(currentView?.columns) ? currentView?.columns : Object.values(currentView?.columns);

    const colors = {};

    let colorScale = null;

    colorScale = this.getColorScale(
      this.data.map((d) => currentView?.paintFn ? currentView.paintFn(d) : d[columns?.[0]])
        .filter(d => d)
    );

    if(false && geoid?.length === 5){
      const record = this.data.find(d => d.geoid === geoid);
      const value = currentView?.paintFn ? currentView.paintFn(record) : record?.[columns?.[0]];
      colors[geoid] = colorScale(value);
    }else{
      const geoids = this.data.map(d => d.geoid);
      const stateFips = (geoid?.substring(0, 2) || geoids[0] || '00').substring(0, 2);
      console.log('????????????/', geoid?.substring(0, 2), stateFips)


      for (let id = 0; id <= 999; id += 1){
        const gid = stateFips + id.toString().padStart(3, '0');

        const record = this.data.find(d => d.geoid === gid) || {};
        const value = currentView?.paintFn ? currentView.paintFn(record) : record[columns?.[0]];
        colors[gid] = geoids.includes(gid) && value ? colorScale(value) : '#CCC';
      }
    }

    map.setFilter("counties", ["in", ['get', "geoid"], ['literal', Object.keys(colors)]]);
    map.setFilter("counties-line", ["in", ['get', "geoid"], ['literal', Object.keys(colors)]]);
    map.setPaintProperty("counties", "fill-color", ["get", ["get", "geoid"], ["literal", colors]]);

  }

  render(map, falcor) {
    this.paintMap(map);
    this.handleMapFocus(map);

  }
}

export const ChoroplethCountyFactory = (options = {}) => new EALChoroplethOptions(options);
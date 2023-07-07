import get from "lodash/get";
import { LayerContainer } from "../../../modules/avl-maplibre/src";
import { getColorRange } from "../../../modules/avl-components/src";
import { fnum } from "../../DataManager/utils/macros";

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
      "source-layer": "tl_2020_us_county",
      "type": "fill",
      "paint": {
        "fill-color": '#969696'
      }
    },
    {
      "id": "counties-line",
      "source": "counties",
      "source-layer": "tl_2020_us_county",
      "type": "line",
      paint: {
        "line-width": [
          "interpolate",
          ["linear"],
          ["zoom"],
          5, 0,
          22, 1
        ],
        "line-color": "#000000",
        "line-opacity": 0.5
      }
    },
  ];

  legend = {
    Title: e => '',
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
        let { view: currentView, data } = this.props;
        const keyMapping = key => Array.isArray(currentView?.columns) ? key : Object.keys(currentView?.columns || {}).find(k => currentView.columns[k] === key);
        let record = data.find(d => d.geoid === feature.properties.geoid),
          response = [
            [feature.properties.geoid, ''],
            ...Object.keys(record || {})
              .filter(key => key !== 'geoid')
              .map(key => keyMapping(key) ? [keyMapping(key), fnum(get(record, key))] : [fnum(get(record, key))]),
            currentView?.paintFn ? ['Total', fnum(currentView.paintFn(record || {}) || 0)] : null
          ];
        return response;
      }, []);
    }
  };

  init(map, falcor, props) {
    map.fitBounds([-125.0011, 24.9493, -66.9326, 49.5904]);
  }

  // fetchData(falcor) {
  //
  // }

  handleMapFocus(map, props) {
    if (props.mapFocus) {
      try {
          map.fitBounds(props.mapFocus)
      } catch (e) {
        map.fitBounds([-125.0011, 24.9493, -66.9326, 49.5904]);
      }
    } else {
    map.fitBounds([-125.0011, 24.9493, -66.9326, 49.5904]);
    }
  }

  paintMap(map, props) {
    let { geoColors = {}, domain = [], colors = [], title = '', geoLayer = 'counties' } = props
    this.legend.domain = domain;
    this.legend.range = colors;
    this.legend.title = title;
    // const hideLayer = geoLayer === 'counties' ? 'tracts' : 'counties';
    map.setFilter(geoLayer, ["in", ['get', "geoid"], ['literal', Object.keys(geoColors)]]);
    map.setFilter(`${geoLayer}-line`, ["in", ['get', "geoid"], ['literal', Object.keys(geoColors)]]);
    map.setPaintProperty(geoLayer, "fill-color", ["get", ["get", "geoid"], ["literal", geoColors]]);
    // map.setLayoutProperty(hideLayer, 'visibility', 'none');
    // map.setLayoutProperty(`${hideLayer}-line`, 'visibility', 'none');
  }

  receiveProps(props, prev, map, falcor) {
    this.paintMap(map, props);
    this.handleMapFocus(map, props);
  }

  // render(map, falcor) {
  // }
}

export const ChoroplethCountyFactory = (options = {}) => new EALChoroplethOptions(options);
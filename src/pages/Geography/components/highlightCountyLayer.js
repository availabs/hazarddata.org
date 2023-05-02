import get from "lodash.get";
import { LayerContainer } from "modules/avl-map/src";

class EALChoroplethOptions extends LayerContainer {
  constructor(props) {
    super(props);
  }

  name = "hlc";
  id = "hlc";

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
    // {
    //   "id": "states-line",
    //   "source": "states",
    //   "source-layer": "us_states",
    //   "type": "line",
    //   paint: {
    //     "line-width": [
    //       "interpolate",
    //       ["linear"],
    //       ["zoom"],
    //       4, 2,
    //       22, 2
    //     ],
    //     "line-color": "#e11111",
    //     "line-opacity": 1,
    //   }
    // },
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

  init(map, falcor, props) {
    map.fitBounds([-125.0011, 24.9493, -66.9326, 49.5904]);
  }

  fetchData(falcor) {
    if(!this.props.geoid) return Promise.resolve();

    const eal_source_id = 229,
      eal_view_id = 577;
    console.log('fetching..', this.props.geoid)
    const dependencyPath = ['dama', this.props.pgEnv, 'viewDependencySubgraphs', 'byViewId', eal_view_id],
      geomColName = 'geom',
      geomColTransform = ['st_asgeojson(st_envelope(ST_Simplify(geom, 0.5)), 9, 1) as geom'],
      geoIndices = {from: 0, to: 0},
      geoPath    = ({view_id}) =>
                        ['dama', this.props.pgEnv, 'viewsbyId', view_id,
                        'options', JSON.stringify({ filter: { geoid: [this.props.geoid[0].substring(0, 2)]}}),
                          'databyIndex'
                        ];


      return falcor.get(dependencyPath).then(res => {
        const deps = get(res, ['json', ...dependencyPath, 'dependencies']);
        const stateView = deps.find(d => d.type === 'tl_state');

        return falcor.get(
          [...geoPath(stateView), geoIndices, geomColTransform]
        )
          .then(res => {
            const geom = get(res, ["json", ...geoPath(stateView), 0, geomColTransform]);
            if(geom){
              this.mapFocus =  get(JSON.parse(geom), 'bbox');
            }
            }
          )
      })

  }

  handleMapFocus(map) {
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

  paintMap(map) {
    let { geoid, currentGeoid } = this.props

    if(geoid?.length) {
      const colors = {}

      for (let id = 0; id <= 999; id += 1){
        const gid = geoid[0].substring(0, 2) + id.toString().padStart(3, '0')
        colors[gid] = '#cccccc'
      }
      console.log('geoids', currentGeoid, geoid)
      geoid.forEach(gid => {
        colors[gid] = gid === currentGeoid || geoid.length === 1 || !currentGeoid || currentGeoid?.length === 2 ? '#ffa600' : '#2549de';
      })

      map.setFilter("counties", ["in", ['get', "geoid"], ['literal', Object.keys(colors)]]);
      map.setFilter("counties-line", ["in", ['get', "geoid"], ['literal', Object.keys(colors)]]);
      // map.setFilter("states-line", ["==", "GEOID", geoid.substring(0, 2)]);
      map.setPaintProperty("counties", "fill-color", ["get", ["get", "geoid"], ["literal", colors]]);
    }
  }

  render(map, falcor) {
    this.paintMap(map);
    this.handleMapFocus(map);

  }
}

export const HighlightCountyFactory = (options = {}) => new EALChoroplethOptions(options);
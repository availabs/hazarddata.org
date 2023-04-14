import React, { useState } from "react";
import get from 'lodash.get';
import { getColorRange, useFalcor } from '../../../modules/avl-components/src';
import { useSelector } from 'react-redux';
import { selectPgEnv } from '../../DataManager/store';
import { RenderSvgBar } from './svgBar';
import {
  hazardsMeta,
  ctypeColors
} from '../../DataManager/DataTypes/constants/colors';
import { fnumIndex } from '../../DataManager/utils/macros';
import { scaleQuantize } from 'd3-scale';

const palattes = [
  ["#f5b899", "#f8b46f", "#fdd0a2", "#fdae6b",
    "#fd8d3c", "#f16913", "#d94801", "#a63603",
    "#7f2704"],
  ["#f5b899", "#f8b46f", "#ffa342", "#ff8218",
    "#e76100", "#c94e00", "#be4000", "#9d3400",
    "#792606"],
  ["#ffb950", "#FFAD33", "#FF931F", "#FF7E33",
    "#FA5E1F", "#B81702", "#A50104", "#8E0103",
    "#7A0103"],
  ["#FFB600", "#FFAA00", "#FF9E00", "#FF9100",
    "#FF8500", "#FF7900", "#FF6D00", "#FF6000",
    "#FF4800"],
]

const colors = scaleQuantize().domain([0, 101]).range(palattes[2]);

export const HazardStatBox = ({geoid, hazard, eal_source_id, eal_view_id, size = 'large', isTotal=false}) => {
  const {falcor, falcorCache} = useFalcor();
  const [nriIds, setNriIds] = useState({source_id: null, view_id: null});
  const [fusionIds, setfusionIds] = useState({source_id: null, view_id: null});
  const pgEnv = useSelector(selectPgEnv);
  const freqCol = `sum(${get(hazardsMeta, [hazard, 'prefix'], 'total')}_afreq) as freq`,
        expCol  = `sum(${get(hazardsMeta, [hazard, 'prefix'], 'total')}_expt) as exp`;
  const npCol = isTotal ? 'national_percent_total' : 'national_percent_hazard',
        spCol = isTotal ? 'state_percent_total' : 'state_percent_hazard',
        ealCol = isTotal ? 'avail_eal_total' : 'avail_eal',
        fusionGroupByCol = isTotal ? 'geoid' : 'nri_category';

  const blockClass = {
    large: 'flex flex-col pt-2',
    small: 'flex flex-row justify-between pt-2 text-xs'
  };
  const blockWrapper = {
    large: `flex flex-col justify-between shrink-0 ml-5 pt-2`,
    small: `flex flex-col`
  };
  const svgBarHeight = {
    large: 30,
    small: 20
  };

  let
    fipsCol =  `substring(stcofips, 1, ${geoid.length})`,
    nriOptions = JSON.stringify({
      filter: { [fipsCol] : [geoid] },
      groupBy: [fipsCol]
    }),
    nriPath = ({source_id, view_id}) => ['dama', pgEnv, 'viewsbyId', view_id, 'options', nriOptions];
  let
    actualDamageCol = 'sum(fusion_property_damage) + sum(fusion_crop_damage) + sum(swd_population_damage) as actual_damage',
    geoidCOl = `substring(geoid, 1, ${geoid.length})`,
    fusionAttributes = isTotal ? [geoidCOl, actualDamageCol] :
      [geoidCOl, 'nri_category', actualDamageCol],
    fusionOptions = JSON.stringify({
      filter: isTotal ? { [geoidCOl]: [geoid] } : { [geoidCOl]: [geoid], nri_category: [hazard] },
      groupBy: isTotal ? [geoidCOl] : [geoidCOl, 'nri_category']
    }),
    fusionPath = ({view_id}) => ['dama', pgEnv, 'viewsbyId', view_id, 'options', fusionOptions]

  React.useEffect(() => {
    falcor.get(
      ['dama', pgEnv, 'viewDependencySubgraphs', 'byViewId', eal_view_id],
      ['comparative_stats', pgEnv, 'byEalIds', 'source', eal_source_id, 'view', eal_view_id, 'byGeoid', geoid],
      ).then(async (res) => {
        const deps = get(res, ['json', 'dama', pgEnv, 'viewDependencySubgraphs', 'byViewId', eal_view_id, 'dependencies']);
        const nriView = deps.find(d => d.type === 'nri');
        const fusionView = deps.find(d => d.type === 'fusion');

        setNriIds(nriView);
        setfusionIds(fusionView);

        const len = 1;
        const fusionByIndexRoute = [...fusionPath(fusionView), 'databyIndex', {from: 0, to: len - 1}, fusionAttributes];

        const routes = isTotal && len ? [fusionByIndexRoute] :
                      !isTotal && len ? [[...nriPath(nriView), 'databyIndex', {from: 0, to: len - 1},  [freqCol, expCol]], fusionByIndexRoute] : []
        return falcor.get(...routes);
      })
  }, [geoid, hazard, falcorCache])

  const data = get(falcorCache, ['comparative_stats', pgEnv, 'byEalIds', 'source', eal_source_id, 'view', eal_view_id, 'byGeoid', geoid, 'value'], [])
                  .find(row => row.geoid === geoid && (row.nri_category === hazard || isTotal));

  const nationalPercentile = get(data, npCol, 0) * 100;
  const statePercentile = get(data, spCol, 0) * 100;


  return (
    <div className={`border border-gray-200 p-5 bg-white`}>
      <div className={'w-full border-b-2'}>{isTotal ? 'Total' : hazardsMeta[hazard].name}</div>
      <div className={`w-full ${size === 'large' ? `flex flex-row justify-between` : ``}`}>
        <div className={'w-full'}>

          <div className={'w-full pt-4'}>
            <RenderSvgBar
              data={[{label: 'National Percentile', value: (nationalPercentile).toFixed(2)}]}
              width={ nationalPercentile }
              height={ svgBarHeight[size] }
              color={ colors(nationalPercentile) }
            />
          </div>
          {
            isTotal &&
            <div className={'w-full pt-4'}>
              <RenderSvgBar
                data={[{label: 'Statewide Percentile', value: (statePercentile).toFixed(2)}]}
                width={ statePercentile }
                height={ svgBarHeight[size] }
                color={ colors(statePercentile) }
              />
            </div>
          }
        </div>
        <div className={blockWrapper[size]}>
          <div className={blockClass[size]}><label>EAL</label>
            <span className={'font-medium text-gray-800'}>
              ${fnumIndex(get(data, ealCol, 0))}
            </span>
          </div>
          <div className={blockClass[size]}><label>Actual Loss</label>
            <span className={'font-medium text-gray-800'}>
              ${fnumIndex(get(falcorCache, [...fusionPath(fusionIds), 'databyIndex', 0, actualDamageCol]))}
            </span>
          </div>
          {
            !isTotal ?
              <>
                <div className={blockClass[size]}><label>Exposure</label>
                  <span className={'font-medium text-gray-800'}>
                    ${fnumIndex(get(falcorCache, [...nriPath(nriIds), 'databyIndex', 0, expCol]))}
                  </span>
                </div>
                <div className={blockClass[size]}><label>Frequency</label>
                  <span className={'font-medium text-gray-800'}>
                    {(get(falcorCache, [...nriPath(nriIds), 'databyIndex', 0, freqCol], 0)).toFixed(2)}
                  </span>
                </div>
              </> : null
          }
        </div>
      </div>
    </div>
  )
}
import React, {useEffect,useState, useMemo} from "react";
import {AvlMap} from "../../modules/avl-map/src";
import {useFalcor} from "../../modules/avl-components/src";
import {useSelector} from "react-redux";
import {selectPgEnv} from "../DataManager/store";
import {RenderDemoControl} from "./components/controls";
import {ChoroplethCountyFactory} from "./components/choroplethLayer";
import config from "../../config.json";
import get from "lodash.get";
import {scaleThreshold} from "d3-scale";
import { isNull } from "lodash";
import { getColorRange } from "utils/color-ranges";
import ckmeans from "pages/DataManager/utils/ckmeans";
const Map = ({baseUrl = 'datasources'}) => {
 
    
    const [selectedOption, setSelectedOption] = useState('');
    const [selectedHazard, setSelectedHazard] = useState('');
    const [data, setData]=useState([]);
  


 const handleSelectedOption = (option) => {
    // Use the selected option value as needed
    setSelectedOption(option);
    
    console.log('Selected option:', selectedOption);
  };

  const handleSelectedHazard = (hazard) => {
    // Use the selected hazard value as needed
    setSelectedHazard(hazard);
    console.log("hazard",selectedHazard);
    //console.log('Selected hazard:', hazard);
  };

  
    const { falcor, falcorCache } = useFalcor();
    const pgEnv = useSelector(selectPgEnv);
    const map_layers = useMemo(() => [ChoroplethCountyFactory()], []);
   
     
          
      const attributes=['geoid','sum(fusion_crop_damage + fusion_property_damage + swd_population_damage) as total_damage_sum'];

        let len2;
       
        const data3 = []; 

    // falcor call to get the data 
        useEffect(() => {

            const options = JSON.stringify({
                 filter: {  nri_category: [selectedHazard], ...selectedOption==="nondeclared" && {disaster_number:["null"]} },
                 exclude: {...selectedOption==="declared" && {disaster_number:["null"]}, 
                },
                   aggregatedLen: true,
                   groupBy: ['geoid','nri_category']
                 });

            const fetchData = async () => {

            const response2 = await falcor.get(['dama', pgEnv, 'viewsbyId', 666, 'options', options, 'length']);
            const length = response2.json.dama[pgEnv].viewsbyId[666].options[options].length;
            
            len2=length;

            const response = await falcor.get(['dama', pgEnv, 'viewsbyId', 666, 'options', options, 'databyIndex', { from: 0, to: len2 }, attributes]);
            const fusiondata = response.json.dama[pgEnv].viewsbyId[666].options[options].databyIndex;
            console.log('fd?', fusiondata)
            console.log('length?', len2);
            console.log('options?', options);
        
            // Extract the values of "geoid" and "sum(fusion_crop_damage + fusion_property_damage + swd_population_damage) as total_damage_sum"
            const geoids = Object.values(fusiondata).map(record => record.geoid);
            const totalDamageSums = Object.values(fusiondata).map(record => record['sum(fusion_crop_damage + fusion_property_damage + swd_population_damage) as total_damage_sum']);
        
            const data3 = geoids.map((geoid, index) => ({
              geoid: geoid,
              total_damage_sum: totalDamageSums[index]
            }));
            setData(data3);
            console.log("data-3", data3);
       
        }
        fetchData() 
    },[len2, selectedOption, selectedHazard]);
        
        
        console.log("data---", data3); 
 // color code here:

const getDomain = (data = [], range = []) => {
    console.log("getdomain-function");

    if (!data?.length || !range?.length) return [];
    return data?.length && range?.length ? ckmeans(data, Math.min(data?.length, range?.length)) : [];
}
const getColorScale = (data, colors) => {
    console.log("getcolorscale-function");

    const domain = getDomain(data, colors)

    return scaleThreshold()
        .domain(domain)
        .range(colors);
}

const getGeoColors = ({ geoid, data = [], columns = [], paintFn, colors = [] }) => {
    console.log("getgeocolor-function");
    if (!data?.length || !colors?.length) return {};
    const geoids = data.map(d => d.geoid);
    console.log("geoids",geoids);
    const stateFips = (geoid?.substring(0, 2) || geoids[0] || '00').substring(0, 2);
    console.log("statefips",stateFips);
    const geoColors = {};
  
    // Extract total_damage_sum values from data
    const totalDamageSums = data.map(record => record[columns?.[0]]).filter(f => f);
  
    // Get color scale and domain using the extracted total_damage_sum values
    const colorScale = getColorScale(totalDamageSums.filter(d => d), colors);
    const domain = getDomain(totalDamageSums.filter(d => d), colors);
  
    data.forEach(record => {
      const value = paintFn ? paintFn(record) : record[columns?.[0]];
      console.log('value?', value)
      geoColors[record.geoid] = value ? colorScale(value) : '#CCC';
    });
    console.log('debugging this', totalDamageSums, colors, domain, geoColors)
    return { geoColors, domain };
  };


const { geoColors, domain } = getGeoColors({ geoid: '36', data: data, columns: ['total_damage_sum'], paintFn: null, 
colors: ["#FFF7EC","#FEE8C8","#FDD49E","#FDBB84","#FC8D59","#EF6548","#D7301F","#B30000","#7F0000"] });
console.log("geocolor",geoColors);
console.log("domain",domain);
const layerProps = {
    ccl: {geoColors}
  }

    return (
        <div className="mx-auto p-4 my-1 block">

            <RenderDemoControl prop1={'prop 1 value'} prop2={'prop 2 value'} onOptionSelect={handleSelectedOption} onHazardSelect={handleSelectedHazard} />

            <div className={'h-[800px] w-full'}>
                <AvlMap
                    mapbox_logo={false}
                    navigationControl={false}
                    accessToken={config.MAPBOX_TOKEN}
                    falcor={falcor}
                    mapOptions={{
                        // styles: [
                        //   // { name: "Light", style: "mapbox://styles/am3081/ckdfzeg1k0yed1ileckpfnllj" }
                        // ]
                    }}
                    layers={map_layers}
                    layerProps={layerProps}
                    CustomSidebar={() => <div />}
                />
            </div>

        </div>
    )
}

const mapConfig = [{
    name: "Map",
    path: "/map",
    exact: false,
    auth: false,
    mainNav: true,
    sideNav: {
        color: "dark",
        size: "none"
    },
    component: Map
}];

export default mapConfig;
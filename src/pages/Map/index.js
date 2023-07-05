import React, {useMemo} from "react";
import {AvlMap} from "../../modules/avl-map/src";
import {useFalcor} from "../../modules/avl-components/src";
import {useSelector} from "react-redux";
import {selectPgEnv} from "../DataManager/store";
import {RenderDemoControl} from "./components/controls";
import {ChoroplethCountyFactory} from "./components/choroplethLayer";
import config from "../../config.json";

const Map = ({baseUrl = 'datasources'}) => {
    const { falcor, falcorCache } = useFalcor();
    const pgEnv = useSelector(selectPgEnv);
    const map_layers = useMemo(() => [ChoroplethCountyFactory()], []);
    return (
        <div className="mx-auto p-4 my-1 block">

            <RenderDemoControl prop1={'prop 1 value'} prop2={'prop 2 value'}/>


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
                    // layerProps={layerProps}
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
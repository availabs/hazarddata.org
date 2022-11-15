import Pages from "./default";
import freight_atlas_shapefile from "./freight_atlas_shapefile";
import npmrdsTravelTime from "./npmrdsTravelTime";
import gis_dataset from "./gis_dataset";
import ncei_storm_events from "./ncei_storm_events";
import ncei_storm_events_enhanced from "./ncei_storm_events_enhanced";
import zone_to_county from "./zone_to_county";
import tiger_2017 from "./tiger_2017";

const DataTypes = {
  freight_atlas_shapefile,
  npmrdsTravelTime,
  gis_dataset,
  ncei_storm_events,
  ncei_storm_events_enhanced,
  zone_to_county,
  tiger_2017
};

export { DataTypes, Pages };

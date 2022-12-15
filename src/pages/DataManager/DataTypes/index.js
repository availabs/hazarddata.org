import Pages from "./default";
import freight_atlas_shapefile from "./freight_atlas_shapefile";
import npmrdsTravelTime from "./npmrdsTravelTime";
import gis_dataset from "./gis_dataset";
import ncei_storm_events from "./ncei_storm_events";
import ncei_storm_events_enhanced from "./ncei_storm_events_enhanced";
import zone_to_county from "./zone_to_county";
import tiger_2017 from "./tiger_2017";
import open_fema_data from "./open_fema_data"
import usda from "./usda"
import sba from "./sba"
import nri from "./nri"

const DataTypes = {
  freight_atlas_shapefile,
  npmrdsTravelTime,
  gis_dataset,
  ncei_storm_events,
  ncei_storm_events_enhanced,
  zone_to_county,
  tiger_2017,
  open_fema_data,
  usda,
  sba,
  nri
};

export { DataTypes, Pages };

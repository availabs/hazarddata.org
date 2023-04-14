import {AsyncTypeahead, Menu, MenuItem} from 'react-bootstrap-typeahead';
import { Link, useNavigate } from "react-router-dom";
import get from "lodash.get";
import { useFalcor } from "../../../modules/avl-components/src";
import { useSelector } from "react-redux";
import { selectPgEnv } from "../../DataManager/store";
import { useEffect, useState } from "react";



const handleSearch = (text, selected, setSelected) => {
  if(selected) setSelected([])
}

const onChangeFilter = (selected, setSelected, value, geoData, navigate) => {
  const geoid = get(selected, [0, 'geoid']);
  if(geoid){
    setSelected(selected);
    navigate(`/geography/${geoid}`)
  }else{
    setSelected([])
  }
}
const menuItemsLinks = (option) => {
  return <Link key={option.geoid} className="block hover:bg-gray-200 text-xl tracking-wide" to={`/geography/${option.geoid}`}>{option.name}</Link>;
}
const menuItemsList = (option, props) => (
  <ul className={`bg-gray-100`}>
    <span className={'text-xl tracking-wide'}>{option.name}</span>
  </ul>
)

const renderMenu = (results, menuProps, ...props) => (
  <Menu className={'bg-gray-100 overflow-hidden z-10'} {...menuProps}>
    {results.map((result, idx) => menuItemsLinks(result))}
  </Menu>
);

const getStateData = async ({ falcor, pgEnv }) => {
  const stateViewId = 285

  const geoAttributes = ['geoid', 'stusps', 'name'],
        geoOptions = JSON.stringify({}),
        geoRoute = ['dama', pgEnv, 'viewsbyId', stateViewId, 'options', geoOptions]
  const lenRes = await falcor.get([...geoRoute, 'length']);
  const len = get(lenRes, ['json', ...geoRoute, 'length']);
  if(len > 0){
    const geoRouteIndices = {from: 0, to:  len - 1}
    const indexRes = await falcor.get([...geoRoute, 'databyIndex', geoRouteIndices, geoAttributes]);
    return Object.values(get(indexRes, ['json', ...geoRoute, 'databyIndex'], {}));
  }
}
const getCountyData = async ({ falcor, pgEnv, statesData, setGeoData }) => {
  const countyViewId = 286

  const geoAttributesMapping = {'geoid': 'geoid', 'name': 'namelsad as name'},
        geoAttributes = Object.values(geoAttributesMapping),
        geoOptions = JSON.stringify({}),
        geoRoute = ['dama', pgEnv, 'viewsbyId', countyViewId, 'options', geoOptions]

  const lenRes = await falcor.get([...geoRoute, 'length']);
  const len = get(lenRes, ['json', ...geoRoute, 'length']);

  if(len > 0){
    const geoRouteIndices = {from: 0, to:  len - 1}
    const indexRes = await falcor.get([...geoRoute, 'databyIndex', geoRouteIndices, geoAttributes]);

    const geoData = Object.values(get(indexRes, ['json', ...geoRoute, 'databyIndex'], {}))
      .filter(county => county.geoid)
      .map(county => {
        const state = get(statesData.find(sd => sd.geoid === county.geoid.substring(0, 2)), 'stusps', '');
        return {geoid: county.geoid, name: `${county[geoAttributesMapping.name]}, ${state}`};
      })

    geoData.push(...statesData.map(sd => ({geoid: sd.geoid, name: `${sd.name} State`})))
    setGeoData(geoData)
  }
}

export const Search = ({ className, value }) => {
  const navigate = useNavigate();
  const { falcor, falcorCache } = useFalcor();
  const [geoData, setGeoData] = useState([]);
  const [selected, setSelected] = useState([]);
  const pgEnv = useSelector(selectPgEnv);

  useEffect(async () => {
    const statesData = await getStateData({ falcor, pgEnv });
    await getCountyData({ falcor, pgEnv, statesData, setGeoData });
  }, [pgEnv, falcor]);

  useEffect(() => {
    setSelected(geoData.filter(gd => value && gd.geoid === value))
  }, [geoData, value]);

  return (
    <div className={`flex flex row ${className} w-full`}>
      <i className={`fa fa-search font-light text-xl text-gray-500 pr-2 pt-1`} />
      <AsyncTypeahead
        className={'w-full'}
        isLoading={false}
        onSearch={handleSearch}
        minLength = {2}
        id="geography-search"
        key="geography-search"
        placeholder="Search for a Geography..."
        options={geoData}
        labelKey={(option) => `${option.name}`}
        defaultSelected={ selected }
        onChange = {(selected) => onChangeFilter(selected, setSelected, value, geoData, navigate)}
        selected={ selected }
        inputProps={{ className: 'bg-gray-100 w-full' }}
        renderMenu={renderMenu}
      />
      </div>
  )
}
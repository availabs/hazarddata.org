import React from 'react';
import {useEffect, useState} from 'react';
import {useFalcor, Table} from "modules/avl-components/src";
import { useSelector } from "react-redux";
import { selectPgEnv } from 'pages/DataManager/store';
import get from "lodash.get";
import { useTable } from 'react-table';

const Disaster = (props) => {

 //Start here 
 
  const { falcor, falcorCache } = useFalcor();
  const pgEnv = useSelector(selectPgEnv);
  const viewId = 537; // Assuming that the viewId prop is passed to the component
  const length = props.length; // 
  const options = JSON.stringify({
    aggregatedLen: true,
    groupBy: ['disaster_number']
  });


  

const indices = [0, 1, 2, 3, 4, 5, 6]; // Replace with the appropriate array of indices
const attributes = ['disaster_number', 'sum(ihp_Loss) as ihp_loss', 'sum(pa_Loss) as pa_loss','sum(sba_Loss) as sba_loss','sum(nfip_Loss) as nfip_loss', 'sum(fema_property_damage) as fema_property_damage','sum(fema_crop_damage) as fema_crop_damage']; // Replace with the appropriate array of attributes
    const result = {};
  

// const totallength = get(falcorCache, ['dama', pgEnv, 'viewsbyId', 537,'options',options, 'length'], {});
// //const metadata = get(falcorCache, ['dama', pgEnv, 'viewsbyId', 537, 'options',options, 'databyIndex' ], {});
// // console.log('meta-data',metadata)
// const  fromIndex1=0
//   const toIndex1=totallength;

// const metadata = falcor.get( ['json', 'dama', pgEnv, 'viewsbyId', 537, 'options', options , 'databyIndex']);
// //console.log('Data response:', fromIndex, toIndex, data);

// // CODE for table component
// const data = Object.values(metadata);
// console.log("data-from-without function",data);
// console.log("data-length", totallength);
//  //console.log('data-only',data)

useEffect(() => {
  const fetchData = async () => {
      const lengthResponse = await falcor.get(['dama', pgEnv, 'viewsbyId', viewId, 'options', options, 'length']);
      const len = get(lengthResponse, ['json', 'dama', pgEnv, 'viewsbyId', viewId, 'options', options, 'length']);

      const dataResponse = await falcor.get(['dama', pgEnv, 'viewsbyId', 537, 'options', options, 'databyIndex', 
      {from: 0, to: len - 1 }, attributes]);
      console.log('Data response:', dataResponse);

      // process the responses here
  }

  fetchData();
}, []);

console.log('falcorChache-1',falcorCache)

//const metadata = get(falcorCache, ['dama', pgEnv, 'viewsbyId', 537,'options',options, 'length'], {});
const metadata = get(falcorCache, ['dama', pgEnv, 'viewsbyId', 537, 'options',options, 'databyIndex' ], {});
console.log('meta-data-without funtcion-without function',metadata)

// CODE for table component
const data = Object.values(metadata);
console.log('data-only-without function',data);
console.log("data-length-without-function", data.length);

const columns = [
  { Header: 'Disaster Number', accessor: 'disaster_number', align: 'left' , filter:'text'},
  { Header: 'IHP Loss', accessor: 'sum(ihp_Loss) as ihp_loss', align: 'right' },
  { Header: 'PA Loss', accessor: 'sum(pa_Loss) as pa_loss', align: 'right' },
  { Header: 'SBA Loss', accessor: 'sum(sba_Loss) as sba_loss' , align: 'right'},
  { Header: 'NFIP Loss', accessor: 'sum(nfip_Loss) as nfip_loss', align: 'right' },
  { Header: 'FEMA Property Damage', accessor: 'sum(fema_property_damage) as fema_property_damage',align: 'right' },
  { Header: 'FEMA Crop Damage', accessor: 'sum(fema_crop_damage) as fema_crop_damage',align: 'right' },
];


// END HERE 
 // Set the desired page number
  const pageSize = 5; // Set the desired page size

  // try {
  //   const additionalData = await GetAdditionalData(pageNumber, pageSize);
  //   console.log('Additional data:', additionalData);
  //   // Process the additional data or perform any necessary operations
  // } catch (error) {
  //   console.error('Error fetching additional data:', error);
  //   // Handle the error appropriately
  // }
// function added here
const GetAdditionalData = async (currentPage, falcor, pgEnv, pageSize) => {
  console.log('trying to fetch', currentPage, pageSize)
  const viewId = 537; // Assuming that the viewId prop is passed to the component

  const options = JSON.stringify({
    aggregatedLen: true,
    groupBy: ['disaster_number']
  });

  try {
    // Perform an asynchronous operation to fetch additional data
    const response1 = await falcor.get(['dama', pgEnv, 'viewsbyId', viewId, 'options', options, 'length']);
    const length = response1.json.dama[pgEnv].viewsbyId[viewId].options[options].length;

    console.log("length",length);


   const fromIndex = currentPage * pageSize;
   const toIndex = Math.min(length - 1, (currentPage * pageSize) + pageSize - 1);

   const dataResponse = await falcor.get([
  'dama', pgEnv, 'viewsbyId', 537, 'options', options, 'databyIndex',
  { from: fromIndex, to: toIndex },
  attributes
]);
const data = get(dataResponse, ['json', 'dama', pgEnv, 'viewsbyId', 537, 'options', options , 'databyIndex']);
console.log('Data response:', fromIndex, toIndex, data);

console.log('returning data?', Object.keys(data).filter(key => key !== '$__path').map(key => data[key]))
return {
  data: Object.keys(data).filter(key => key !== '$__path').map(key => data[key]),
  length // Assuming 'length' represents the total number of records
};


  } catch (error) {
    // Handle any errors that occur during the data fetching process
    console.error('Error fetching additional data:', error);
    return null; // Or you can throw an error or return an empty array/object depending on your use case
  }
}
// function ends here

  return (
    // JSX for your component here
    <div className='min-h-screen flex-1 flex flex-col text-gray-900 bg-gray-100'>
    <div className="flex-1 flex flex-col">
    <div className="text-6xl font-bold">Disaster</div>
    <Table
     data={[]}
     columns={columns}
     pageSize={10}
     fetchData={({ currentPage, pageSize }) => GetAdditionalData(currentPage, falcor, pgEnv, pageSize)}
     /> 
     
     <Table
     data={data}
     columns={columns}
     pageSize={10}
     /> 
     
</div> 
</div>
  );
  
}


const config = {
  name:'',
  // title: 'Transportation Systems Management and Operations (TSMO) System Performance Dashboards',
  // icon: 'fa-duotone fa-home',
  path: "/disasters",
  exact: true,
  auth: false,
  mainNav: false,
  sideNav: {
    color: 'dark',
    size: 'none'
  },
  component: Disaster
}

export default config;

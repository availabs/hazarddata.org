import React from 'react';
import {useEffect, useState} from 'react';
import {useFalcor, Table} from "modules/avl-components/src";
import { useSelector } from "react-redux";
import { selectPgEnv } from 'pages/DataManager/store';
import get from "lodash.get";
import { useTable } from 'react-table';

const Disaster = (props) => {

 
  const { falcor, falcorCache } = useFalcor();
  const pgEnv = useSelector(selectPgEnv);
  const viewId = 537; // Assuming that the viewId prop is passed to the component
  const length = props.length; // 
  const options = JSON.stringify({
    aggregatedLen: true,
    groupBy: ['disaster_number']
  });


  

//     route: `dama[{keys:pgEnvs}].viewsbyId[{keys:damaViewIds}].databyIndex[{integers:dataIndices}]`,
//     route: `dama[{keys:pgEnvs}].viewsbyId[{keys:damaViewIds}].data.length`,

//   useEffect(() => {
//     const indexes = Array.from({ length: 11 }, (_, i) => i);

//     falcor
//       .chunk(['dama', pgEnv, 'viewsbyId', 537, 'options',options, 'length' ]
//       )
//       .then(response => {
//         console.log("hello", response)
//       })
//       .catch(error => {
//         // Handle the error here
//         console.log('err', error)
//       });
// })

const indices = [0, 1, 2, 3, 4, 5, 6]; // Replace with the appropriate array of indices
const attributes = ['disaster_number', 'sum(ihp_Loss) as ihp_loss', 'sum(pa_Loss) as pa_loss','sum(sba_Loss) as sba_loss','sum(nfip_Loss) as nfip_loss', 'sum(fema_property_damage) as fema_property_damage','sum(fema_crop_damage) as fema_crop_damage']; // Replace with the appropriate array of attributes
    const result = {};

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
console.log('meta-data',metadata)

// CODE for table component
const data = Object.values(metadata);
console.log('data-only',data)

const columns = [
  { Header: 'Disaster Number', accessor: 'disaster_number', align: 'left' },
  { Header: 'IHP Loss', accessor: 'sum(ihp_Loss) as ihp_loss', align: 'center' },
  { Header: 'PA Loss', accessor: 'sum(pa_Loss) as pa_loss',align: 'center' },
  { Header: 'SBA Loss', accessor: 'sum(sba_Loss) as sba_loss' , align: 'center'},
  { Header: 'NFIP Loss', accessor: 'sum(nfip_Loss) as nfip_loss',align: 'center' },
  { Header: 'FEMA Property Damage', accessor: 'sum(fema_property_damage) as fema_property_damage',align: 'center' },
  { Header: 'FEMA Crop Damage', accessor: 'sum(fema_crop_damage) as fema_crop_damage',align: 'center' },
];


// END HERE 

// const metadata1 = get(falcorCache, ['dama', pgEnv, 'viewsbyId', 537, 'options', options, 'databyIndex'], []);
// const attributesData = metadata1.map(data => get(data, attributes, {}));
// console.log('attributes data:', attributesData);

// Loop over the object
let onsoleOutput = '';


if (typeof metadata === 'object' && metadata !== null) {
  // Loop over the object
  for (const [key, value] of Object.entries(metadata)) {
    // Log each property
    console.log(`${value['disaster_number']}: ${value['sum(ihp_Loss) as ihp_loss']}`);
   // consoleOutput += `${value['disaster_number']}: ${value['total_obligated_amount_pa']}\n`;

  }
} else {
  console.error('Data object is null or undefined');
}



//console.log('meta-data',Object.keys(metadata))
//const colData = Object.keys(metadata)
//console.log('coldata',Object.keys(metadata))


// const array_chunksize = 100;
// const totalItems = 1000;

// const array_chunks = Array.from({ length: Math.ceil(totalItems / array_chunksize) }, (_, i) => [
//   i * array_chunksize,
//   Math.min((i + 1) * array_chunksize - 1, totalItems - 1)
// ]);

// array_chunks.forEach((chunk, index) => {
//   console.log(`Chunk ${index}: ${chunk[0]} - ${chunk[1]}`);
// });

// array_chunks.forEach((array_chunk, index) => {
//   const chunkData = useFalcorRequest(array_chunk[0]);

//   console.log(`Chunk ${index}:`, chunkData);
// });

// const chunkData = useFalcorRequest(array_chunks[0]);
// console.log("chuckData",chunkData);

  return (
    // JSX for your component here
    <div className='min-h-screen flex-1 flex flex-col text-gray-900 bg-gray-100'>
    <div className="flex-1 flex flex-col">
    <div className="text-6xl font-bold">Disaster</div>
   
     <Table
     columns={columns}
     data={data} pageSize={50}
     />
   
 
</div> 
</div>
  );
  
}
  

// function useFalcorRequest(chunkIndex) {
//   const { falcor, falcorCache } = useFalcor();
//   const pgEnv = useSelector(selectPgEnv);

//   useEffect(() => {
//     falcor
//       .get(['dama', pgEnv, 'viewsbyId', 512, 'databyIndex', chunkIndex, ['disaster_number', 'total_obligated_amount_pa']])
//       .then(response => {
//        console.log("output", response);
//       })
//       .catch(error => {
//         console.log('Error:', error);
//       });
//   }, [chunkIndex]);
//   console.log('falcorChache-2',falcorCache)

//  // return data;
// }

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

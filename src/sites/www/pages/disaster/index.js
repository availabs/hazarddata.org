import React from 'react';
import {useEffect, useState} from 'react';
import {useFalcor} from "modules/avl-components/src";
import { useSelector } from "react-redux";
import { selectPgEnv } from 'pages/DataManager/store';
import get from "lodash.get";

const Disaster = (props) => {

 
  const { falcor, falcorCache } = useFalcor();
  const pgEnv = useSelector(selectPgEnv);
   const viewId = props.viewId; // Assuming that the viewId prop is passed to the component
   const length = props.length; // 



//     route: `dama[{keys:pgEnvs}].viewsbyId[{keys:damaViewIds}].databyIndex[{integers:dataIndices}]`,
//     route: `dama[{keys:pgEnvs}].viewsbyId[{keys:damaViewIds}].data.length`,

  useEffect(() => {
    const indexes = Array.from({ length: 11 }, (_, i) => i);

    falcor
      .chunk(['dama', pgEnv, 'viewsbyId', 512, 'databyIndex', indexes, ['disaster_number', 'total_obligated_amount_pa']]
      )
      .then(response => {
        console.log("hello", response)
      })
      .catch(error => {
        // Handle the error here
        console.log('err', error)
      });
})
console.log('falcorChache-1',falcorCache)

const metadata = get(falcorCache, ['dama', pgEnv, 'viewsbyId', 512,'databyId']);


console.log(metadata)

// Loop over the object
let consoleOutput = '';


if (typeof metadata === 'object' && metadata !== null) {
  // Loop over the object
  for (const [key, value] of Object.entries(metadata)) {
    // Log each property
    console.log(`${value['disaster_number']}: ${value['total_obligated_amount_pa']}`);
    consoleOutput += `${value['disaster_number']}: ${value['total_obligated_amount_pa']}\n`;

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
    <table>
      <thead>
        <tr>
          <th>Disaster Number</th>
          <th>Total Obligated Amount (PA)</th>
        </tr>
      </thead>
      <tbody>
        {Object.entries(metadata).map(([key, value]) => (
          <tr key={key}>
            <td>{value['disaster_number']}</td>
            <td>{value['total_obligated_amount_pa']}</td>
          </tr>
        ))}
      </tbody>
    </table>

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

import React, { useState, useEffect } from 'react';
import { Dropdown } from "modules/avl-components/src";
//import { hazards } from "pages/DataManager/DataTypes/hazard_mitigation/eal/map.js"

export const RenderDemoControl = ({prop1, prop2, onOptionSelect, onHazardSelect}) => {
    const options =["Total", "Declared","Non-Declared"];
    const hazards = [
        "avalanche", "coastal", "coldwave", "drought", "earthquake", "hail", "heatwave", "hurricane", "icestorm", "landslide", "lightning", "riverine", "tornado", "tsunami", "volcano", "wildfire", "wind", "winterweat"
      ]

    const [selectedHazard, setSelectedHazard] = useState('riverine'); // Default value "riverine"
    const [selectedOption, setSelectedOption] = useState('Total'); // Default value "total"
  

    useEffect(() => {
        onOptionSelect(selectedOption);
      }, [selectedOption]);
    
      useEffect(() => {
        onHazardSelect(selectedHazard);
      }, [selectedHazard]);

    return (
        <div style={{ display: 'flex', justifyContent: 'space-evenly', margin: '5px' }}>
        <div className='flex flex-1'>
        <div className='py-3.5 px-2 text-sm text-gray-400'>Disaster Type: 
        </div>
        <div className='flex-1'>

        <Dropdown control={<button style={{ background: '#f0f0f0', color: '#333', border: '1px solid #ccc', borderRadius: '4px', padding: '8px 12px', cursor: 'pointer' }}>
        {selectedOption}</button>} className="custom-dropdown">
        <ul style={{ background: 'white', color: 'black' }}>
    {options.map((option) => (
      <li key={option} onClick={() => setSelectedOption(option)}>{option}</li>
    ))}
  </ul>
</Dropdown>
</div>
        </div>
        <div className='flex flex-1'>
        <div className='py-3.5 px-2 text-sm text-gray-400'>Hazard Type: </div>
        <div className='flex-1'>
        <Dropdown control={<button style={{ background: '#f0f0f0', color: '#333', border: '1px solid #ccc', borderRadius: '4px', padding: '8px 12px', cursor: 'pointer' }}>
           {selectedHazard}</button>} className="custom-dropdown">
           <ul style={{ background: 'white', color: 'black' }}>
           {hazards.map((hazard) => (
               <li key={hazard} onClick={() => setSelectedHazard(hazard)}>{hazard}</li>
             ))}
     </ul>
   </Dropdown>
   </div>
        </div>
        </div>
    )
}
export default RenderDemoControl;

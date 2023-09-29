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

      const handleOptionChange = (event) => {
        setSelectedOption(event.target.value); // Update the selected option when the user selects a value from the select tag
      };

      const handleHazardChange = (event) => {
        setSelectedHazard(event.target.value); // Update the selected option when the user selects a value from the select tag
      };

    return (
        <div style={{ display: 'flex', justifyContent: 'space-evenly', margin: '5px' }}>
        <div className='flex flex-1' style={{  maxWidth: '400px', marginRight: '10px' }}>
        <div className='py-3.5 px-2 text-sm text-black-400'>Disaster Declaration: 
        </div>
        <div className='flex-1'>
        <select  
        className="pl-3 pr-4 py-2.5 border border-white-100 bg-white-50  mr-2 flex items-center justify-between text-sm"
        value={selectedOption} onChange={handleOptionChange}>
        <option value="">Select an option</option> {/* This is the default empty option */}
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
   

       
</div>
        </div>
        <div className='flex flex-1'>
        <div className='py-3.5 px-2 text-sm text-black-400'>Hazard Type: </div>
        <div className='flex-1'>
        <select  
        className="pl-3 pr-4 py-2.5 border border-white-100 bg-white-50  bg-white mr-2 flex items-center justify-between text-sm"
        value={selectedHazard} onChange={handleHazardChange}>
        {hazards.map((hazard) => (
            <option key={hazard} value={hazard}>
              {hazard}
            </option>
          ))}
      </select>
   </div>
        </div>
        </div>
    )
}
export default RenderDemoControl;

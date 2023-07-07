import React from 'react'
import { withAuth, Table } from "modules/avl-components/src";

let counties = [{"geoid":"36001", "name":"Albany County", num: 112176},
{"geoid":"36003", "name":"Allegany County", num: 35084},
{"geoid":"36005", "name":"Bronx County", num: 104509},
{"geoid":"36007", "name":"Broome County", num: 86745},
{"geoid":"36009", "name":"Cattaraugus County", num: 55171},
{"geoid":"36011", "name":"Cayuga County", num: 43853},
{"geoid":"36013", "name":"Chautauqua County", num: 79426},
{"geoid":"36015", "name":"Chemung County", num: 40639},
{"geoid":"36017", "name":"Chenango County", num: 34724},
{"geoid":"36019", "name":"Clinton County", num: 42319},
{"geoid":"36021", "name":"Columbia County", num: 41436},
{"geoid":"36023", "name":"Cortland County", num: 23812},
{"geoid":"36025", "name":"Delaware County", num: 37658},
{"geoid":"36027", "name":"Dutchess County", num: 102297},
{"geoid":"36029", "name":"Erie County", num: 432085},
{"geoid":"36031", "name":"Essex County", num: 29625},
{"geoid":"36033", "name":"Franklin County", num: 26431},
{"geoid":"36035", "name":"Fulton County", num: 30619},
{"geoid":"36037", "name":"Genesee County", num: 47559},
{"geoid":"36039", "name":"Greene County", num: 31899},
{"geoid":"36041", "name":"Hamilton County", num: 8613},
{"geoid":"36043", "name":"Herkimer County", num: 39552},
{"geoid":"36045", "name":"Jefferson County", num: 61430},
{"geoid":"36047", "name":"Kings County", num: 331715},
{"geoid":"36049", "name":"Lewis County", num: 20622},
{"geoid":"36051", "name":"Livingston County", num: 36695},
{"geoid":"36053", "name":"Madison County", num: 38374},
{"geoid":"36055", "name":"Monroe County", num: 262507},
{"geoid":"36057", "name":"Montgomery County", num: 26405},
{"geoid":"36059", "name":"Nassau County", num: 484859},
{"geoid":"36061", "name":"New York County", num: 45923},
{"geoid":"36063", "name":"Niagara County", num: 99634},
{"geoid":"36065", "name":"Oneida County", num: 106897},
{"geoid":"36067", "name":"Onondaga County", num: 168455},
{"geoid":"36069", "name":"Ontario County", num: 55791},
{"geoid":"36071", "name":"Orange County", num: 235517},
{"geoid":"36073", "name":"Orleans County", num: 24116},
{"geoid":"36075", "name":"Oswego County", num: 65358},
{"geoid":"36077", "name":"Otsego County", num: 38339},
{"geoid":"36079", "name":"Putnam County", num: 41958},
{"geoid":"36081", "name":"Queens County", num: 458722},
{"geoid":"36083", "name":"Rensselaer County", num: 65243},
{"geoid":"36085", "name":"Richmond County", num: 140224},
{"geoid":"36087", "name":"Rockland County", num: 72854},
{"geoid":"36091", "name":"Saratoga County", num: 90673},
{"geoid":"36093", "name":"Schenectady County", num: 57947},
{"geoid":"36095", "name":"Schoharie County", num: 22381},
{"geoid":"36097", "name":"Schuyler County", num: 14310},
{"geoid":"36099", "name":"Seneca County", num: 20587},
{"geoid":"36101", "name":"Steuben County", num: 64737},
{"geoid":"36089", "name":"St. Lawrence County", num: 57372},
{"geoid":"36105", "name":"Sullivan County", num: 48522},
{"geoid":"36107", "name":"Tioga County", num: 28774},
{"geoid":"36109", "name":"Tompkins County", num: 36535},
{"geoid":"36111", "name":"Ulster County", num: 89276},
{"geoid":"36113", "name":"Warren County", num: 34692},
{"geoid":"36115", "name":"Washington County", num: 36885},
{"geoid":"36117", "name":"Wayne County", num: 49525},
{"geoid":"36119", "name":"Westchester County", num: 211894},
{"geoid":"36121", "name":"Wyoming County", num: 25530},
{"geoid":"36123", "name":"Yates County", num: 19483}
]


const BuildingFootprints = () => {
  return (
    <div className="max-w-6xl mx-auto"> 
      <div className='flex'>
        <div className='flex-1 '>
          <div className='flex w-full p-2 border-b items-center'>
            <div className="text-2xl text-gray-700 font-medium overflow-hidden ">
              AVAIL 2018 Building Footprint Dataset
            </div>
            <div className='flex-1'></div>
          </div>
          <div className='w-full bg-white p-4 mt-2'>
            <div className="">
      <Table
        data={counties}
        sortBy={'name'}
        pageSize={63}
        columns={[
          {
            Header: "County",
            accessor: "name"
          },
          {
            Header: "Num Buildings",
            accessor: c => c['num'].toLocaleString()
          },
          {
            Header: "Download",
            accessor: c => <a href={ `/data/bf/${c.geoid}_footprints.zip`}>Download</a>,
            
          },
        ]}
      />

    </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const config = {
  name: "",
  path: "/buildingfootprints",
  exact: true,
  authLevel: 5,
  mainNav: false,
  sideNav: {
    color: "dark",
    size: "none"
  },
  component: BuildingFootprints
};

export default config;
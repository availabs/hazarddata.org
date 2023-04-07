import React from "react";

function Bars({ data, height, width, color }) {
  return (
    <>
      {data.map(({ value, label }) => (
        <>
          <rect
            key={`bar-bg-${label}`}
            x={0}
            y={12}
            width={`100%`}
            height={height}
            rx="15"
            fill={'rgba(159,159,159,0.7)'}
          />
          <rect
            key={`bar-${label}`}
            x={0}
            y={12}
            width={`${width}%`}
            height={height}
            rx="15"
            fill={color}
          />
          <text fill="black"
                fillOpacity="1"
                x={0} y={5}
                textAnchor="left"
                rotate="0" kerning="auto"
                fontSize="12.5px"
                > {label} </text>
          <text fill="white"
                fillOpacity="1"
                // stroke="white"
                // strokeOpacity="100"
                // strokeWidth="1"
                // strokeLinecap="butt"
                // strokeLinejoin="miter"
                // strokeMiterlimit="4"
                x={10} y={(height / 2) + 16}
                textAnchor="left"
                textRendering="auto"
                fontStyle="normal" fontVariant="normal" fontWeight="bold"
                fontSize="14.5px"  paintOrder="stroke"
          > {value} </text>
        </>
      ))}
    </>
  );
}

export const RenderSvgBar = ({
                       data,
                       height = 30,
                       width,
                       margin = {left:1, top: 5, right: 1, bottom: 1},
                       color
}) => {
  return (
    <svg
      className={'w-full'}
      // width={width + margin.left + margin.right}
      height={height + margin.top + margin.bottom + 10}
    >
      <g transform={`translate(${margin.left}, ${margin.top})`}>
        <Bars data={data} height={height} width={width} color={color}/>
      </g>
    </svg>
  )
}

"use client";
import * as React from "react";
import Slider, { SliderThumb } from "@mui/material/Slider";
import { styled } from "@mui/material/styles";
import Box from "@mui/material/Box";

const AirbnbSlider = styled(Slider)(({ theme }) => ({
  color: "#ff8c00",
  height: 4,

  "& .MuiSlider-thumb": {
    height: 20,
    width: 20,
    backgroundColor: "#fff",
    border: "5px solid currentColor",
    "&:hover": {
      boxShadow: "0 0 0 8px rgba(255,140,0,0.16)",
    },
  },
  "& .MuiSlider-track": {
    height: 4,
  },
  "& .MuiSlider-rail": {
    color: "rgba(255,140,0,0.16)",
    opacity: 1,
    height: 4,
  },
}));

interface AirbnbThumbComponentProps extends React.HTMLAttributes<unknown> {}

function AirbnbThumbComponent(props: AirbnbThumbComponentProps) {
  const { children, ...other } = props;
  return <SliderThumb {...other}>{children}</SliderThumb>;
}

export default function PriceSlider() {
  const [value, setValue] = React.useState<number[]>([30000, 54]);

  const handleChange = (event: Event, newValue: number | number[]) => {
    setValue(newValue as number[]);
  };

  return (
    <>
      <div>
        <Box sx={{ width: "90%", textAlign: "center", margin: "auto" }}>
          <AirbnbSlider
            slots={{ thumb: AirbnbThumbComponent }}
            value={value}
            min={54}
            max={30000}
            onChange={handleChange}
            valueLabelDisplay="auto"
            getAriaLabel={() => "Price range"}
            getAriaValueText={(val) => `${val} `}
        
          />
          <div className="flex justify-between text-sm font-medium text-gray-600 mb-2">
            <p>من</p>
            <span>{value[1].toLocaleString()} ريال</span>
            <p>الي</p>
            <span>{value[0].toLocaleString()} ريال</span>
          </div>
        </Box>
      </div>
    </>
  );
}

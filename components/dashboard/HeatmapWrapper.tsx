import React from "react"
import HeatmapChart from "@/components/ui/HeatmapChart"

interface HeatmapWrapperProps {
  dates: string[]
  hours: string[]
  data: number[][]
}

function areEqual(prevProps: HeatmapWrapperProps, nextProps: HeatmapWrapperProps) {
  if (prevProps.dates.length !== nextProps.dates.length) return false
  if (prevProps.hours.length !== nextProps.hours.length) return false

  for (let i = 0; i < prevProps.dates.length; i++) {
    if (prevProps.dates[i] !== nextProps.dates[i]) return false
  }
  for (let i = 0; i < prevProps.hours.length; i++) {
    if (prevProps.hours[i] !== nextProps.hours[i]) return false
  }

  if (prevProps.data.length !== nextProps.data.length) return false
  for (let i = 0; i < prevProps.data.length; i++) {
    if (prevProps.data[i].length !== nextProps.data[i].length) return false
    for (let j = 0; j < prevProps.data[i].length; j++) {
      if (prevProps.data[i][j] !== nextProps.data[i][j]) return false
    }
  }

  return true
}

const HeatmapWrapper: React.FC<HeatmapWrapperProps> = React.memo(({ dates, hours, data }) => {
  return <HeatmapChart dates={dates} hours={hours} data={data} />
}, areEqual)

export default HeatmapWrapper

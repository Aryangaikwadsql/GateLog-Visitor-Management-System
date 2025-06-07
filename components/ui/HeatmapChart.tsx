import React, { useEffect, useRef } from "react"
import Chart from "chart.js/auto"
import { MatrixController, MatrixElement } from "chartjs-chart-matrix"
import "chartjs-adapter-date-fns"

Chart.register(MatrixController, MatrixElement)

interface HeatmapChartProps {
  data: number[][]
  dates: string[] // array of date strings for Y-axis (last 7 days)
  hours: string[] // array of hour labels for X-axis (24-hour format)
}

const HeatmapChart: React.FC<HeatmapChartProps> = ({ data, dates, hours }) => {
  const chartRef = useRef<HTMLCanvasElement>(null)
  const chartInstance = useRef<any>(null)

  useEffect(() => {
    if (!chartRef.current) return

    // Flatten data for heatmap: each cell is a point with x (hour), y (date), and v (value)
    const heatmapData = []
    for (let y = 0; y < dates.length; y++) {
      for (let x = 0; x < hours.length; x++) {
        heatmapData.push({ x: hours[x], y: dates[y], v: data[y][x] || 0 })
      }
    }

    if (chartInstance.current) {
      chartInstance.current.destroy()
    }

    chartInstance.current = new Chart(chartRef.current, {
      type: "matrix",
      data: {
        datasets: [
          {
            label: "Visitor Traffic Heatmap",
            data: heatmapData,
            backgroundColor: (ctx: any) => {
              const value = ctx.dataset.data[ctx.dataIndex].v
              // Color scale from light to dark blue based on value
              const alpha = Math.min(0.1 + value / 10, 1)
              return `rgba(37, 99, 235, ${alpha})` // Tailwind blue-600 with variable opacity
            },
            borderWidth: 1,
            borderColor: "white",
            width: ({ chart }: { chart: any }) => (chart.chartArea || {}).width / hours.length - 2,
            height: ({ chart }: { chart: any }) => (chart.chartArea || {}).height / dates.length - 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            type: "category",
            labels: hours,
            offset: true,
            grid: {
              display: false,
            },
            title: {
              display: true,
              text: "Time (24-hour)",
              font: { size: 14, weight: "bold" },
            },
            ticks: {
              maxRotation: 90,
              minRotation: 45,
              autoSkip: true,
              maxTicksLimit: 12,
              font: { size: 10 },
            },
          },
          y: {
            type: "category",
            labels: dates,
            offset: true,
            grid: {
              display: false,
            },
            title: {
              display: true,
              text: "Date",
              font: { size: 14, weight: "bold" },
            },
            ticks: {
              font: { size: 10 },
            },
          },
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (context: any) => {
                const v = context.dataset.data[context.dataIndex].v
                return `Visitors: ${v}`
              },
            },
          },
        },
      },
      plugins: [
        {
          id: "matrix",
          beforeDraw: (chart: any) => {
            const ctx = chart.ctx
            const dataset = chart.data.datasets[0]
            const meta = chart.getDatasetMeta(0)
            meta.data.forEach((rect: any, index: any) => {
              const value = dataset.data[index].v
              const width = rect.width
              const height = rect.height
              const x = rect.x - width / 2
              const y = rect.y - height / 2
              ctx.fillStyle = dataset.backgroundColor({ dataIndex: index, dataset, chart })
              ctx.fillRect(x, y, width, height)
              ctx.strokeStyle = dataset.borderColor
              ctx.lineWidth = dataset.borderWidth
              ctx.strokeRect(x, y, width, height)
            })
          },
        },
      ],
    })

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy()
      }
    }
  }, [data, dates, hours])

  return (
    <div className="w-full h-96 sm:h-72 md:h-96">
      <canvas ref={chartRef} />
    </div>
  )
}

export default HeatmapChart

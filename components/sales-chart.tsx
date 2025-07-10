"use client"

import { useRef } from "react"
import { Line } from "react-chartjs-2"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  type ChartData,
  type ChartOptions,
} from "chart.js"

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

export function SalesChart() {
  const chartRef = useRef<ChartJS>(null)

  const data: ChartData<"line"> = {
    labels: ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"],
    datasets: [
      {
        label: "Pendapatan",
        data: [150000, 230000, 180000, 350000, 200000, 320000, 280000],
        borderColor: "#00A651",
        backgroundColor: "rgba(0, 166, 81, 0.1)",
        tension: 0.4,
        fill: true,
      },
      {
        label: "Keuntungan",
        data: [80000, 120000, 90000, 200000, 110000, 180000, 150000],
        borderColor: "#3b82f6",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        tension: 0.4,
        fill: true,
      },
    ],
  }

  const options: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            let label = context.dataset.label || ""
            if (label) {
              label += ": "
            }
            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat("id-ID", {
                style: "currency",
                currency: "IDR",
                minimumFractionDigits: 0,
              }).format(context.parsed.y)
            }
            return label
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
      },
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => "Rp " + value.toLocaleString("id-ID"),
        },
      },
    },
  }

  return (
    <div className="h-[300px] w-full">
      <Line data={data} options={options} />
    </div>
  )
}


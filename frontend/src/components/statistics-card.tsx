import Card from "./card"
import { Car } from "lucide-react"

interface StatisticsCardProps {
  vehicleCount: number
}

export default function StatisticsCard({ vehicleCount }: StatisticsCardProps) {
  return (
    <Card title="Statistics" className="bg-[#3a3a9f]">
      <div className="flex flex-col items-center">
        <Car className="w-20 h-20 text-white mb-4" />
        <h2 className="text-5xl font-bold text-white">{vehicleCount} cars</h2>
        <p className="text-white mt-1">Vehicle Count</p>
      </div>
    </Card>
  )
}


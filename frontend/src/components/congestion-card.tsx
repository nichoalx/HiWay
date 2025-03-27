import Card from "./card"
import CongestionGauge from "./congestion-gauge"
import { Star } from "lucide-react"

interface CongestionCardProps {
  level: string
  predictionMinutes: number
}

export default function CongestionCard({ level, predictionMinutes }: CongestionCardProps) {
  return (
    <Card title="Congestion Meter" className="bg-[#3a3a9f]">
      <div className="flex flex-col items-center">
        <CongestionGauge level={level} />
        <p className="mt-2 text-white">
          <span className="font-bold">{level}</span> Congestion
        </p>

        <div className="flex items-center mt-6 text-sm text-white">
          <Star className="w-4 h-4 mr-2 fill-white" />
          <p>Congestion prediction for the next {predictionMinutes} Minutes</p>
        </div>
      </div>
    </Card>
  )
}


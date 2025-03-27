import Card from "./card"
import AnomalyItem from "./anomaly-item"

interface Anomaly {
  type: string
  value?: string
  count?: number
}

interface AnomaliesCardProps {
  anomalies: Anomaly[]
}

export default function AnomaliesCard({ anomalies }: AnomaliesCardProps) {
  return (
    <Card title="Anomalies" className="bg-[#8a93c0]">
      <div className="w-full space-y-4">
        {anomalies.map((anomaly, index) => {
          let text = ""

          if (anomaly.type === "speeding") {
            text = `Car detected speeding at ${anomaly.value}`
          } else if (anomaly.type === "dwelling") {
            text = `Car detected with dwelling time of ${anomaly.value}`
          } else if (anomaly.type === "lessVehicles") {
            text = `Lesser vehicle count of ${anomaly.count} vehicles`
          }

          return <AnomalyItem key={index} text={text} />
        })}
      </div>
    </Card>
  )
}


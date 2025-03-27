interface TrafficCameraViewProps {
  location: string
  direction: string
  time: string
}

export default function TrafficCameraView({ location, direction, time }: TrafficCameraViewProps) {
  return (
    <div className="relative rounded-lg overflow-hidden h-[300px]">
      {/* Traffic camera image placeholder */}
      <img
        src="/placeholder.svg?height=300&width=600"
        alt="Traffic camera view"
        className="w-full h-full object-cover"
      />

      <div className="absolute bottom-0 left-0 right-0 p-4 bg-black bg-opacity-50 text-white">
        <div className="text-lg font-medium">{location}</div>
        <div className="flex justify-between">
          <span>Facing {direction}</span>
          <span>{time}</span>
        </div>
      </div>
    </div>
  )
}


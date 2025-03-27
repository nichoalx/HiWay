import Header from "../components/header"
import DashboardLayout from "../components/dashboard-layout"
import CongestionCard from "../components/congestion-card"
import AnomaliesCard from "../components/anomalies-card"
import StatisticsCard from "../components/statistics-card"
import MapSection from "../components/map-section"
import TrafficCameraView from "../components/traffic-camera-view"

export default function Home() {
  // This data would typically come from an API
  const dashboardData = {
    location: "Bukit Batok Central",
    congestion: {
      level: "HIGH",
      predictionMinutes: 10,
    },
    anomalies: [
      { type: "speeding", value: "80 km/h" },
      { type: "dwelling", value: "60s" },
      { type: "lessVehicles", count: 3 },
    ],
    statistics: {
      vehicleCount: 5,
    },
    camera: {
      location: "Bukit Batok Central",
      direction: "North",
      time: "10:45",
    },
  }

  return (
    <main className="min-h-screen bg-[#1a1b36]">
      <div className="container mx-auto px-4 py-6">
        <Header title="HiWay" location={dashboardData.location} />

        <DashboardLayout>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <CongestionCard
              level={dashboardData.congestion.level}
              predictionMinutes={dashboardData.congestion.predictionMinutes}
            />
            <AnomaliesCard anomalies={dashboardData.anomalies} />
            <StatisticsCard vehicleCount={dashboardData.statistics.vehicleCount} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <MapSection />
            <TrafficCameraView
              location={dashboardData.camera.location}
              direction={dashboardData.camera.direction}
              time={dashboardData.camera.time}
            />
          </div>
        </DashboardLayout>
      </div>
    </main>
  )
}


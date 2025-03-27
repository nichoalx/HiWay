"use client"

interface MapTabsProps {
  activeTab: string
  onChange: (tab: string) => void
}

export function MapTabs({ activeTab, onChange }: MapTabsProps) {
  const tabs = [
    { id: "dwell", label: "Dwell" },
    { id: "speed", label: "Speed" },
    { id: "count", label: "Count" },
  ]

  return (
    <div className="flex rounded-full overflow-hidden">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`px-6 py-2 text-white ${
            activeTab === tab.id
              ? "bg-[#3a3a9f]"
              : activeTab === "count" && tab.id === "count"
                ? "bg-[#8a93c0]"
                : "bg-[#3a3a9f] bg-opacity-70"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}


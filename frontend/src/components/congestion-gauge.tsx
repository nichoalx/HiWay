"use client"

import { useEffect, useRef } from "react"

interface CongestionGaugeProps {
  level: string
}

export default function CongestionGauge({ level }: CongestionGaugeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas dimensions
    canvas.width = 200
    canvas.height = 200

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw gauge background
    const centerX = canvas.width / 2
    const centerY = canvas.height / 2
    const radius = 70

    // Draw gauge arc
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius, Math.PI, 2 * Math.PI, false)
    ctx.lineWidth = 20
    ctx.strokeStyle = "#e0e0e0"
    ctx.stroke()

    // Draw colored sections
    const sections = [
      { color: "#4ade80", start: Math.PI, end: Math.PI + Math.PI / 3 }, // Green
      { color: "#facc15", start: Math.PI + Math.PI / 3, end: Math.PI + (2 * Math.PI) / 3 }, // Yellow
      { color: "#ef4444", start: Math.PI + (2 * Math.PI) / 3, end: 2 * Math.PI }, // Red
    ]

    sections.forEach((section) => {
      ctx.beginPath()
      ctx.arc(centerX, centerY, radius, section.start, section.end, false)
      ctx.lineWidth = 20
      ctx.strokeStyle = section.color
      ctx.stroke()
    })

    // Draw needle
    const needleAngle =
      level === "HIGH"
        ? Math.PI + (5 * Math.PI) / 6 // High position
        : level === "MEDIUM"
          ? Math.PI + Math.PI / 2 // Medium position
          : Math.PI + Math.PI / 6 // Low position

    const needleLength = radius + 10

    ctx.beginPath()
    ctx.moveTo(centerX, centerY)
    ctx.lineTo(centerX + needleLength * Math.cos(needleAngle), centerY + needleLength * Math.sin(needleAngle))
    ctx.lineWidth = 3
    ctx.strokeStyle = "white"
    ctx.stroke()

    // Draw needle center
    ctx.beginPath()
    ctx.arc(centerX, centerY, 8, 0, 2 * Math.PI, false)
    ctx.fillStyle = "white"
    ctx.fill()
  }, [level])

  return (
    <div className="relative">
      <canvas ref={canvasRef} width="200" height="200" />
    </div>
  )
}


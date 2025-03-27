interface AnomalyItemProps {
  text: string
}

export default function AnomalyItem({ text }: AnomalyItemProps) {
  return <div className="w-full bg-white bg-opacity-20 rounded-full px-4 py-3 text-white text-center">{text}</div>
}


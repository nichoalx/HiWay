interface HeaderProps {
  title: string
  location: string
}

export default function Header({ title, location }: HeaderProps) {
  return (
    <header className="flex justify-between items-center py-4">
      <h1 className="text-3xl font-semibold text-white">{title}</h1>
      <h2 className="text-xl text-white">{location}</h2>
    </header>
  )
}


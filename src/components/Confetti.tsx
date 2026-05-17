import { useEffect, useState } from 'react'

const COLORS = ['#dc2626', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#f97316', '#06b6d4']

interface Piece {
  id: number
  x: number
  color: string
  delay: number
  duration: number
  size: number
  round: boolean
}

export function Confetti({ active, onDone }: { active: boolean; onDone?: () => void }) {
  const [pieces, setPieces] = useState<Piece[]>([])

  useEffect(() => {
    if (!active) { setPieces([]); return }

    const newPieces: Piece[] = Array.from({ length: 80 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      delay: Math.random() * 0.6,
      duration: 1.8 + Math.random() * 1.4,
      size: 5 + Math.floor(Math.random() * 7),
      round: Math.random() > 0.4,
    }))
    setPieces(newPieces)

    const maxDuration = (0.6 + 1.8 + 1.4) * 1000
    const timer = setTimeout(() => {
      setPieces([])
      onDone?.()
    }, maxDuration)
    return () => clearTimeout(timer)
  }, [active])

  if (pieces.length === 0) return null

  return (
    <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
      {pieces.map(p => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            left: `${p.x}%`,
            top: '-16px',
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: p.round ? '50%' : '2px',
            animation: `confettiFall ${p.duration}s ${p.delay}s ease-in forwards`,
          }}
        />
      ))}
    </div>
  )
}

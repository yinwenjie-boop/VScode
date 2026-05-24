interface RingProgressProps {
  score: number
  max: number
  size?: number
  stroke?: number
}

export default function RingProgress({ score, max, size = 132, stroke = 10 }: RingProgressProps) {
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const pct = Math.max(0, Math.min(1, score / max))
  const color =
    pct >= 0.85 ? '#10b981' :
    pct >= 0.65 ? '#3b82f6' :
    pct >= 0.45 ? '#f59e0b' :
                  '#ef4444'

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="block">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#e5e7eb"
        strokeWidth={stroke}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeDasharray={circumference}
        strokeDashoffset={circumference * (1 - pct)}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dashoffset 600ms ease' }}
      />
      <text
        x={size / 2}
        y={size / 2 - size * 0.04}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={size * 0.34}
        fontWeight={700}
        fill={color}
      >
        {score}
      </text>
      <text
        x={size / 2}
        y={size / 2 + size * 0.24}
        textAnchor="middle"
        fontSize={size * 0.1}
        fill="#9ca3af"
      >
        / {max} 分
      </text>
    </svg>
  )
}

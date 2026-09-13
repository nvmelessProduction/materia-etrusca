/**
 * Siluette disegnate, non fotografie: servono a far capire la differenza fra
 * "un pezzo solo" e "un gruppo", e una foto finta qui ingannerebbe e basta.
 */

const comuni = {
  fill: 'currentColor',
  vectorEffect: 'non-scaling-stroke' as const,
}

export function MiniaturaStile({ stile }: { stile: string }) {
  return (
    <svg
      viewBox="0 0 120 90"
      role="img"
      aria-hidden
      className="text-antracite/70 h-16 w-full"
      preserveAspectRatio="xMidYMax meet"
    >
      <line x1="0" y1="84" x2="120" y2="84" stroke="currentColor" strokeWidth="1" opacity="0.35" />
      {stile === 'minimale' ? <Minimale /> : null}
      {stile === 'mediterraneo' ? <Mediterraneo /> : null}
      {stile === 'scenografico' ? <Scenografico /> : null}
    </svg>
  )
}

/** Un pezzo solo, alto, centrato: tutto il resto è vuoto. */
function Minimale() {
  return <path {...comuni} d="M52 84 L50 40 Q60 28 70 40 L68 84 Z" />
}

/** Una pancia larga e bassa, con un rametto: caldo, un po' disordinato. */
function Mediterraneo() {
  return (
    <>
      <path {...comuni} d="M40 84 Q34 60 48 52 L72 52 Q86 60 80 84 Z" />
      <path
        d="M60 52 Q58 36 50 28 M60 52 Q64 38 74 32"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        opacity="0.7"
      />
    </>
  )
}

/** Tre altezze diverse che fanno gruppo. */
function Scenografico() {
  return (
    <>
      <path {...comuni} d="M22 84 L20 54 Q30 46 40 54 L38 84 Z" />
      <path {...comuni} d="M50 84 L47 26 Q60 16 73 26 L70 84 Z" />
      <path {...comuni} d="M82 84 Q78 68 88 64 L98 64 Q106 70 102 84 Z" />
    </>
  )
}

export function MiniaturaEsposizione({ esposizione }: { esposizione: string }) {
  return (
    <svg viewBox="0 0 60 60" role="img" aria-hidden className="text-antracite/70 size-10">
      {esposizione === 'sole' ? (
        <>
          <circle cx="30" cy="30" r="11" fill="currentColor" />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angolo) => (
            <line
              key={angolo}
              x1="30"
              y1="30"
              x2={30 + 24 * Math.cos((angolo * Math.PI) / 180)}
              y2={30 + 24 * Math.sin((angolo * Math.PI) / 180)}
              stroke="currentColor"
              strokeWidth="2"
            />
          ))}
        </>
      ) : null}
      {esposizione === 'mezzombra' ? (
        <>
          <circle cx="30" cy="30" r="13" fill="currentColor" />
          <path d="M30 17 A13 13 0 0 1 30 43 Z" fill="var(--color-calce)" />
          <circle cx="30" cy="30" r="13" fill="none" stroke="currentColor" strokeWidth="2" />
        </>
      ) : null}
      {esposizione === 'ombra' ? (
        <circle cx="30" cy="30" r="13" fill="none" stroke="currentColor" strokeWidth="2" />
      ) : null}
    </svg>
  )
}

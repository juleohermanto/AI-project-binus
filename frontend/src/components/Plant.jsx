// Placeholder plant illustration. To use the real Figma art, export each plant
// as SVG into src/assets/plants and pass it in: <Plant src={myPlantSvg} />
const VARIANTS = {
  agave: [[-52, 0.85], [-26, 1.05], [0, 1.2], [26, 1.05], [52, 0.85]],
  leafy: [[-62, 0.9], [-28, 1.1], [8, 1.15], [40, 1], [68, 0.75]],
  sprout: [[-40, 0.8], [0, 1.1], [40, 0.8]],
};

export default function Plant({ variant = 'agave', size = 120, src, alt = '' }) {
  if (src) return <img src={src} width={size} alt={alt} />;
  const leaves = VARIANTS[variant] ?? VARIANTS.agave;
  return (
    <svg viewBox="0 0 120 150" width={size} height={size * 1.25} aria-hidden="true">
      <ellipse cx="60" cy="140" rx="42" ry="7" fill="#d9d6cc" />
      <g stroke="#5b2a3a" strokeWidth="4" strokeLinejoin="round" strokeLinecap="round">
        {leaves.map(([angle, scale], i) => (
          <path
            key={i}
            transform={`translate(60 84) rotate(${angle}) scale(${scale})`}
            d="M0 0C14-16 16-42 0-70C-16-42-14-16 0 0Z"
            fill="#a8bf8c"
          />
        ))}
        <path d="M33 96h54l-6 34a6 6 0 0 1-6 5H45a6 6 0 0 1-6-5Z" fill="#f4e9d6" />
        <rect x="28" y="84" width="64" height="14" rx="6" fill="#efc49a" />
      </g>
    </svg>
  );
}

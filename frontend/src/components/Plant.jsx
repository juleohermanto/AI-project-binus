const modules = import.meta.glob('../assets/plants/*.{svg,png,webp,jpg}', {
  eager: true,
  import: 'default',
});

const plants = Object.fromEntries(
  Object.entries(modules).map(([path, url]) => [
    path.split('/').pop().replace(/\.\w+$/, ''),
    url,
  ])
);
const names = Object.keys(plants);
const hash = (s) => [...String(s)].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);

export default function Plant({ variant, size = 130, alt = '' }) {
  const key = plants[variant]
    ? variant
    : names[(typeof variant === 'number' ? variant : hash(variant)) % names.length];

  return (
    <span style={{ position: 'relative', display: 'block', zIndex: 1 }}>
      {/* shadow: attached to the plant, so it always touches the pot */}
      <span
        aria-hidden="true"
        style={{
          position: 'absolute', left: '50%', bottom: size * 0.05, zIndex: 0,
          width: size * 0.75, height: size * 0.1, transform: 'translateX(-50%)',
          borderRadius: '50%', background: 'rgba(9, 30, 18, 0.24)', filter: 'blur(1px)',
        }}
      />
      <img
        src={plants[key]}
        alt={alt}
        style={{ position: 'relative', zIndex: 1, display: 'block', height: size, width: 'auto' }}
      />
    </span>
  );
}
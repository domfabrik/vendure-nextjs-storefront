export function LogoIcon({ size }: { size: number }) {
  const padding = Math.round(size * 0.15);
  const iconSize = size - padding * 2;

  return (
    <div
      style={{
        width: size,
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ffffff',
      }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 96 96"
        width={iconSize}
        height={iconSize}
      >
        <path
          d="M22 32 L48 14 L74 32"
          stroke="#1B2B45"
          strokeWidth="6"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M26 40 H50 a22 21 0 0 1 0 42 H26 Z M36 50 V72 H50 a11 11 0 0 0 0 -22 Z"
          fill="#1B2B45"
          fillRule="evenodd"
        />
      </svg>
    </div>
  );
}

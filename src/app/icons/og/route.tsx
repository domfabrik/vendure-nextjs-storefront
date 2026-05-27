import { ImageResponse } from 'next/og';

const SIZE = { width: 1200, height: 630 };

export async function GET() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8f9fa',
      }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 420 96"
        width="420"
        height="96"
      >
        <g>
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
        </g>
        <text
          x="116"
          y="68"
          style={{ fontFamily: 'sans-serif', fontSize: '64px', letterSpacing: '-1.6px', fill: '#1B2B45' }}
        >
          <tspan style={{ fontWeight: 700 }}>Dom</tspan>
          <tspan style={{ fontWeight: 400, opacity: 0.55 }}>Fabrik</tspan>
        </text>
      </svg>
      <p
        style={{
          fontSize: '32px',
          color: '#555',
          marginTop: '24px',
          fontFamily: 'sans-serif',
        }}
      >
        Элитная мебель для дома
      </p>
    </div>,
    {
      ...SIZE,
      headers: { 'Cache-Control': 'public, max-age=31536000, immutable' },
    },
  );
}

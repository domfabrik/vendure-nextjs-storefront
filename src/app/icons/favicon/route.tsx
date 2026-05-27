import { ImageResponse } from 'next/og';
import { LogoIcon } from '../logo';

export async function GET() {
  return new ImageResponse(<LogoIcon size={32} />, {
    width: 32,
    height: 32,
    headers: { 'Cache-Control': 'public, max-age=31536000, immutable' },
  });
}

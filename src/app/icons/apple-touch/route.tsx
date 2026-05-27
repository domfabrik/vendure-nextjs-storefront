import { ImageResponse } from 'next/og';
import { LogoIcon } from '../logo';

export async function GET() {
  return new ImageResponse(<LogoIcon size={180} />, {
    width: 180,
    height: 180,
    headers: { 'Cache-Control': 'public, max-age=31536000, immutable' },
  });
}

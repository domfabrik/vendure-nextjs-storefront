import { ImageResponse } from 'next/og';
import { LogoIcon } from '../../logo';

const ALLOWED_SIZES = [192, 512];

export async function GET(_request: Request, { params }: { params: Promise<{ size: string }> }) {
  const { size: sizeParam } = await params;
  const size = Number.parseInt(sizeParam, 10);

  if (!ALLOWED_SIZES.includes(size)) {
    return new Response('Invalid size', { status: 400 });
  }

  return new ImageResponse(<LogoIcon size={size} />, {
    width: size,
    height: size,
    headers: { 'Cache-Control': 'public, max-age=31536000, immutable' },
  });
}

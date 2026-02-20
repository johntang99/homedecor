import { ImageResponse } from 'next/og';

export const size = {
  width: 32,
  height: 32,
};

export const contentType = 'image/png';

const PRIMARY_COLOR = '#8b1d1d';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#ffffff',
        }}
      >
        <div
          style={{
            width: 26,
            height: 26,
            borderRadius: 999,
            border: `2px solid ${PRIMARY_COLOR}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: PRIMARY_COLOR,
            fontSize: 18,
            fontWeight: 800,
            lineHeight: 1,
            fontFamily: 'Georgia, serif',
          }}
        >
          H
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}


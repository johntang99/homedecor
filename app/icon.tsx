import { ImageResponse } from 'next/og';

export const size = {
  width: 32,
  height: 32,
};

export const contentType = 'image/png';

const PRIMARY_COLOR = '#2c2c2c';

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
            fontSize: 14,
            fontWeight: 900,
            lineHeight: 1,
            fontFamily: 'Impact, "Arial Black", Arial, sans-serif',
            letterSpacing: '0px',
            textShadow:
              '0.5px 0 currentColor, -0.5px 0 currentColor, 0 0.5px currentColor, 0 -0.5px currentColor',
          }}
        >
          J
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}


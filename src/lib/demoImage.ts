const demoImageSvg = encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="560" height="360" viewBox="0 0 560 360">
  <defs>
    <linearGradient id="demoImageGradient" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0%" stop-color="#10223b"/>
      <stop offset="48%" stop-color="#0f766e"/>
      <stop offset="100%" stop-color="#2563eb"/>
    </linearGradient>
  </defs>
  <rect width="560" height="360" fill="url(#demoImageGradient)"/>
</svg>
`);

export const demoImageSrc = `data:image/svg+xml;charset=utf-8,${demoImageSvg}`;

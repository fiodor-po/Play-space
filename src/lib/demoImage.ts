const demoImageSvg = encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="560" height="360" viewBox="0 0 560 360">
  <defs>
    <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0%" stop-color="#10223b"/>
      <stop offset="100%" stop-color="#243b63"/>
    </linearGradient>
  </defs>
  <rect width="560" height="360" fill="url(#bg)"/>
  <circle cx="430" cy="88" r="42" fill="#f59e0b" opacity="0.92"/>
  <path d="M0 290L120 200L210 252L320 146L430 210L560 116V360H0Z" fill="#0f766e" opacity="0.9"/>
  <path d="M0 330L112 230L214 292L338 202L560 300V360H0Z" fill="#2563eb" opacity="0.82"/>
  <text x="32" y="52" fill="#f8fafc" font-family="Arial, sans-serif" font-size="28" font-weight="700">Interaction Layer</text>
  <text x="32" y="88" fill="#cbd5e1" font-family="Arial, sans-serif" font-size="18">sandbox image object</text>
</svg>
`);

export const demoImageSrc = `data:image/svg+xml;charset=utf-8,${demoImageSvg}`;

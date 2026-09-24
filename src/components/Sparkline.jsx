import { useRef, useEffect } from 'react';

export default function Sparkline({
  data = [],
  color = '#4cdeea',
  width = 120,
  height = 32,
  minimumLength = 0,
  minimumMax = 5,
}) {
  const canvasRef = useRef(null);
  const prevDataRef = useRef(null);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c || data.length === 0) return;

    // Skip redraw if data hasn't changed
    const prev = prevDataRef.current;
    if (
      prev &&
      prev.length === data.length &&
      prev.every((v, i) => v === data[i])
    )
      return;
    prevDataRef.current = data;

    const ctx = c.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const h = height - 3;
    const w = width;

    c.width = w * dpr;
    c.height = height * dpr;
    c.style.width = `${w}px`;
    c.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    const total = Math.max(minimumLength, data.length);
    const max = Math.max(minimumMax, Math.max(...data));
    const xstep = w / total;
    const ystep = max / h;

    ctx.clearRect(0, 0, w, height);
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;

    let x = 0;
    let y = h - data[0] / ystep;
    ctx.moveTo(x, y);

    for (let i = 1; i < data.length; i++) {
      x += xstep;
      y = h - data[i] / ystep + 2;
      ctx.lineTo(x, y);
    }

    ctx.stroke();
  }, [data, color, width, height, minimumLength, minimumMax]);

  return <canvas ref={canvasRef} className="inline-block" />;
}

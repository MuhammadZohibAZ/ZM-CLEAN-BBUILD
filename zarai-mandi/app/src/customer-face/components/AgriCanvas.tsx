import { useRef, useEffect } from "react";
import agriForegroundImg from "../../assets/agri_foreground.png";

export function AgriAmbientCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || 360);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 600);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };
    window.addEventListener("resize", handleResize);

    const particles = Array.from({ length: 16 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 2.2 + 0.8,
      vx: (Math.random() - 0.45) * 0.3,
      vy: -Math.random() * 0.4 - 0.15,
      alpha: Math.random() * 0.35 + 0.15,
    }));

    let tick = 0;
    const render = () => {
      tick += 0.012;
      ctx.clearRect(0, 0, width, height);

      particles.forEach((p) => {
        p.x += p.vx + Math.sin(tick + p.y * 0.02) * 0.2;
        p.y += p.vy;
        if (p.y < -10) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(168, 220, 200, ${p.alpha})`;
        ctx.fill();
      });

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ opacity: 0.7, zIndex: 0 }}
    />
  );
}

export function AgriForegroundCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.src = agriForegroundImg;

    let animId: number = 0;
    const render = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      const width = rect.width;
      const height = rect.height;

      if (width === 0 || height === 0) return;

      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      if (img.complete && img.naturalWidth > 0) {
        // Draw the curved sagging foreground graphic maintaining aspect ratio, anchored to bottom
        const imgAspect = img.naturalWidth / img.naturalHeight;
        const drawHeight = Math.max(height, width / imgAspect);
        const drawWidth = drawHeight * imgAspect;
        const drawX = (width - drawWidth) / 2;
        const drawY = height - drawHeight;

        ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
      }
      ctx.restore();
    };

    img.onload = () => {
      render();
    };

    const ro = new ResizeObserver(() => {
      render();
    });

    if (canvas.parentElement) {
      ro.observe(canvas.parentElement);
    }

    render();

    return () => {
      ro.disconnect();
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <div
      className="absolute bottom-0 left-0 right-0 pointer-events-none select-none"
      style={{
        height: "clamp(55px, 8vh, 72px)",
        zIndex: 1,
        overflow: "hidden",
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: "100%",
          height: "100%",
          display: "block",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}

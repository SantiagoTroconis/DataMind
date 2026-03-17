import { useEffect, useRef } from 'react';

interface ParticleCanvasProps {
    count?: number;
    connectDist?: number;
}

export function ParticleCanvas({ count = 75, connectDist = 130 }: ParticleCanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let W = 0, H = 0, raf: number;
        const mouse = { x: -9999, y: -9999 };

        interface P { x: number; y: number; vx: number; vy: number; r: number; }
        let pts: P[] = [];

        const init = () => {
            W = canvas.offsetWidth;
            H = canvas.offsetHeight;
            canvas.width = W;
            canvas.height = H;
            pts = Array.from({ length: count }, () => ({
                x: Math.random() * W,
                y: Math.random() * H,
                vx: (Math.random() - 0.5) * 0.32,
                vy: (Math.random() - 0.5) * 0.32,
                r: Math.random() * 1.2 + 0.7,
            }));
        };

        const onResize = () => init();
        const onMouse = (e: MouseEvent) => {
            const rect = canvas.getBoundingClientRect();
            mouse.x = e.clientX - rect.left;
            mouse.y = e.clientY - rect.top;
        };

        window.addEventListener('resize', onResize);
        window.addEventListener('mousemove', onMouse);
        init();

        const draw = () => {
            ctx.clearRect(0, 0, W, H);

            for (const p of pts) {
                // Mouse attraction (very subtle)
                const mdx = mouse.x - p.x;
                const mdy = mouse.y - p.y;
                const md = Math.sqrt(mdx * mdx + mdy * mdy);
                if (md < 180 && md > 0) {
                    const f = (1 - md / 180) * 0.012;
                    p.vx += mdx / md * f;
                    p.vy += mdy / md * f;
                }

                // Speed cap
                const spd = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
                if (spd > 0.65) { p.vx = (p.vx / spd) * 0.65; p.vy = (p.vy / spd) * 0.65; }

                p.x += p.vx;
                p.y += p.vy;

                // Wrap
                if (p.x < -10) p.x = W + 10;
                if (p.x > W + 10) p.x = -10;
                if (p.y < -10) p.y = H + 10;
                if (p.y > H + 10) p.y = -10;

                // Draw dot
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(167,139,250,0.55)';
                ctx.fill();
            }

            // Draw connections
            for (let i = 0; i < pts.length; i++) {
                for (let j = i + 1; j < pts.length; j++) {
                    const dx = pts[i].x - pts[j].x;
                    const dy = pts[i].y - pts[j].y;
                    const d = Math.sqrt(dx * dx + dy * dy);
                    if (d < connectDist) {
                        const alpha = (1 - d / connectDist) * 0.2;
                        ctx.beginPath();
                        ctx.moveTo(pts[i].x, pts[i].y);
                        ctx.lineTo(pts[j].x, pts[j].y);
                        ctx.strokeStyle = `rgba(124,58,237,${alpha})`;
                        ctx.lineWidth = 0.8;
                        ctx.stroke();
                    }
                }
            }

            raf = requestAnimationFrame(draw);
        };

        draw();

        return () => {
            cancelAnimationFrame(raf);
            window.removeEventListener('resize', onResize);
            window.removeEventListener('mousemove', onMouse);
        };
    }, [count, connectDist]);

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full"
            style={{ pointerEvents: 'none' }}
        />
    );
}

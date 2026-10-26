"use client";
import { useEffect, useRef } from "react";

export default function BackgroundCanvas({
  tema = "galaxy",
  particlesEnabled = true,
  musicEnabled = false,
  volume = 0.5
}) {
  const canvasRef = useRef(null);
  const bgmRef = useRef(null);

  // --- 1. ENGINE AUDIO (BGM & SFX) ---
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (!bgmRef.current) {
        bgmRef.current = new Audio("/background-music.mp3");
        bgmRef.current.loop = true;
      }

      bgmRef.current.volume = volume;

      if (musicEnabled) {
        // Promise catch agar tidak error jika browser memblokir autoplay
        bgmRef.current.play().catch(e => console.log("Autoplay butuh interaksi user:", e));
      } else {
        bgmRef.current.pause();
      }
    }
  }, [musicEnabled, volume]);

  // Efek Suara (SFX) Global saat klik tombol
  useEffect(() => {
    const handleGlobalClick = (e) => {
      if (musicEnabled && e.target.closest("button, .glass-btn, .theme-card")) {
        const sfx = new Audio("/sfx-click.mp3");
        sfx.volume = volume;
        sfx.play().catch(() => console.log("SFX ditahan browser"));
      }
    };
    window.addEventListener("click", handleGlobalClick);
    return () => window.removeEventListener("click", handleGlobalClick);
  }, [musicEnabled, volume]);

  // --- 2. ENGINE VISUAL (PARTIKEL) ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animationId;
    let particles = [];

    const initParticles = () => {
      particles = [];
      const w = canvas.width;
      const h = canvas.height;

      if (tema === "galaxy") {
        for (let i = 0; i < 150; i++) particles.push({ x: Math.random() * w, y: Math.random() * h, r: Math.random() * 1.5, alpha: Math.random(), alphaChange: Math.random() * 0.02 - 0.01, type: "star" });
        for (let i = 0; i < 3; i++) particles.push({ x: Math.random() * w, y: Math.random() * h, length: Math.random() * 80 + 20, speedX: (Math.random() * 2 + 1) * (Math.random() > 0.5 ? 1 : -1), speedY: Math.random() * 2 + 1, alpha: Math.random() * 0.5 + 0.1, type: "comet" });
      } else if (tema === "sky") {
        for (let i = 0; i < 5; i++) particles.push({ x: Math.random() * w, y: Math.random() * (h / 2), w: Math.random() * 200 + 100, h: Math.random() * 40 + 20, speed: Math.random() * 0.5 + 0.1, alpha: Math.random() * 0.2 + 0.1, type: "cloud" });
        for (let i = 0; i < 30; i++) particles.push({ x: Math.random() * w, y: Math.random() * h, size: Math.random() * 6 + 3, speedY: Math.random() * 1 + 0.5, angle: Math.random() * Math.PI * 2, angleSpeed: Math.random() * 0.05 - 0.025, color: Math.random() > 0.5 ? "#ffb347" : "#ffcc33", type: "leaf" });
      } else if (tema === "ocean") {
        for (let i = 0; i < 80; i++) particles.push({ x: Math.random() * w, y: Math.random() * h, r: Math.random() * 4 + 1, speedY: -(Math.random() * 2 + 0.5), wobble: Math.random() * Math.PI * 2, wobbleSpeed: Math.random() * 0.05, type: "bubble" });
        for (let i = 0; i < 5; i++) particles.push({ x: Math.random() * w, y: Math.random() * h * 0.8 + h * 0.1, size: Math.random() * 20 + 10, speedX: -(Math.random() * 1.5 + 0.5), wobble: Math.random() * Math.PI * 2, type: "fish" });
      }
    };

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initParticles();
    };

    const drawGalaxy = (p, w, h) => {
      if (p.type === "star") {
        p.alpha += p.alphaChange;
        if (p.alpha <= 0 || p.alpha >= 1) p.alphaChange *= -1;
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.abs(p.alpha)})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === "comet") {
        p.x += p.speedX; p.y += p.speedY;
        if (p.x > w + 100 || p.x < -100 || p.y > h + 100) { p.x = Math.random() * w; p.y = -50; }
        const gradient = ctx.createLinearGradient(p.x, p.y, p.x - p.speedX * 10, p.y - p.speedY * 10);
        gradient.addColorStop(0, `rgba(0, 243, 255, ${p.alpha})`);
        gradient.addColorStop(1, "rgba(0, 243, 255, 0)");
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - p.speedX * 10, p.y - p.speedY * 10);
        ctx.stroke();
      }
    };

    const drawSky = (p, w, h) => {
      if (p.type === "cloud") {
        p.x += p.speed;
        if (p.x > w + p.w) p.x = -p.w;
        ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha})`;
        ctx.beginPath();
        // Fallback aman untuk browser yang tidak dukung roundRect
        if (ctx.roundRect) ctx.roundRect(p.x, p.y, p.w, p.h, p.h / 2);
        else ctx.rect(p.x, p.y, p.w, p.h);
        ctx.fill();
      } else if (p.type === "leaf") {
        p.y += p.speedY; p.angle += p.angleSpeed; p.x += Math.sin(p.angle) * 1;
        if (p.y > h + 10) { p.y = -10; p.x = Math.random() * w; }
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = 0.6;
        ctx.beginPath();
        ctx.ellipse(0, 0, p.size, p.size / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    };

    const drawOcean = (p, w, h) => {
      if (p.type === "bubble") {
        p.y += p.speedY; p.wobble += p.wobbleSpeed; p.x += Math.sin(p.wobble) * 0.5;
        if (p.y < -10) { p.y = h + 10; p.x = Math.random() * w; }
        ctx.strokeStyle = `rgba(255, 255, 255, 0.4)`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.stroke();
      } else if (p.type === "fish") {
        p.x += p.speedX; p.wobble += 0.05; p.y += Math.sin(p.wobble) * 0.5;
        if (p.x < -50) { p.x = w + 50; p.y = Math.random() * h * 0.8 + h * 0.1; }
        ctx.fillStyle = `rgba(0, 0, 0, 0.15)`;
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, p.size, p.size / 3, 0, 0, Math.PI * 2);
        ctx.moveTo(p.x + p.size * 0.8, p.y);
        ctx.lineTo(p.x + p.size * 1.5, p.y - p.size / 2);
        ctx.lineTo(p.x + p.size * 1.5, p.y + p.size / 2);
        ctx.fill();
      }
    };

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      if (!particlesEnabled) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        return;
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        if (tema === "galaxy") drawGalaxy(p, canvas.width, canvas.height);
        else if (tema === "sky") drawSky(p, canvas.width, canvas.height);
        else if (tema === "ocean") drawOcean(p, canvas.width, canvas.height);
      });
    };

    window.addEventListener("resize", resize);
    resize();
    return () => { window.removeEventListener("resize", resize); cancelAnimationFrame(animationId); };
  }, [tema, particlesEnabled]);

  return <canvas ref={canvasRef} className="fixed inset-0 w-full h-full z-0 pointer-events-none block" />;
}

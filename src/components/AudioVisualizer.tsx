import { useEffect, useRef } from 'react';

interface AudioVisualizerProps {
  analyser: AnalyserNode | null;
  isPlaying: boolean;
}

export default function AudioVisualizer({ analyser, isPlaying }: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high DPI screens
    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = container.getBoundingClientRect();
      
      const newWidth = Math.floor(rect.width * dpr);
      const newHeight = Math.floor(rect.height * dpr);

      if (canvas.width !== newWidth || canvas.height !== newHeight) {
        canvas.width = newWidth;
        canvas.height = newHeight;
        ctx.resetTransform();
        ctx.scale(dpr, dpr);
      }
    };

    resizeCanvas();
    const observer = new ResizeObserver(() => {
      window.requestAnimationFrame(() => {
        resizeCanvas();
      });
    });
    observer.observe(container);

    // Dynamic rendering loop
    let phase = 0;
    const render = () => {
      const width = canvas.width / (window.devicePixelRatio || 1);
      const height = canvas.height / (window.devicePixelRatio || 1);

      // Clear with transparent/semi-transparent background for trails
      ctx.fillStyle = 'rgba(15, 23, 42, 0.2)';
      ctx.fillRect(0, 0, width, height);

      if (analyser && isPlaying) {
        // Real-time audio analyzer visualization
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyser.getByteFrequencyData(dataArray);

        const barWidth = (width / bufferLength) * 1.6;
        let barHeight;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          barHeight = (dataArray[i] / 255) * height * 0.85;

          // Elegant Dark Cyan color gradient
          const gradient = ctx.createLinearGradient(0, height, 0, height - barHeight);
          gradient.addColorStop(0, 'rgba(8, 145, 178, 0.9)'); // Teal
          gradient.addColorStop(0.5, 'rgba(6, 182, 212, 0.7)'); // Cyan
          gradient.addColorStop(1, 'rgba(34, 211, 238, 0.95)');  // Bright Cyan

          ctx.fillStyle = gradient;
          
          // Draw rounded bars
          const rx = x;
          const ry = height - barHeight;
          const rw = barWidth - 2;
          const rh = barHeight;
          
          if (rh > 2) {
            ctx.beginPath();
            ctx.roundRect(rx, ry, rw, rh, [4, 4, 0, 0]);
            ctx.fill();
          }

          x += barWidth;
        }
      } else {
        // Idle/Paused simulated ambient waveform
        ctx.beginPath();
        ctx.lineWidth = 2.5;
        
        const gradient = ctx.createLinearGradient(0, 0, width, 0);
        gradient.addColorStop(0, 'rgba(6, 182, 212, 0.1)');
        gradient.addColorStop(0.5, 'rgba(34, 211, 238, 0.5)');
        gradient.addColorStop(1, 'rgba(6, 182, 212, 0.1)');
        ctx.strokeStyle = gradient;

        phase += 0.04;
        for (let i = 0; i < width; i++) {
          const x = i;
          // Render overlapping waves
          const amplitude1 = isPlaying ? 20 : 12;
          const freq1 = 0.007;
          const y = height / 2 + Math.sin(i * freq1 + phase) * amplitude1 + Math.cos(i * 0.015 - phase) * 4;
          
          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();

        // Draw secondary subtle wave
        ctx.beginPath();
        ctx.lineWidth = 1;
        const gradient2 = ctx.createLinearGradient(0, 0, width, 0);
        gradient2.addColorStop(0, 'rgba(8, 145, 178, 0.05)');
        gradient2.addColorStop(0.5, 'rgba(6, 182, 212, 0.3)');
        gradient2.addColorStop(1, 'rgba(8, 145, 178, 0.05)');
        ctx.strokeStyle = gradient2;

        for (let i = 0; i < width; i++) {
          const x = i;
          const amplitude2 = isPlaying ? 10 : 6;
          const freq2 = 0.012;
          const y = height / 2 + Math.sin(i * freq2 - phase * 1.5) * amplitude2;
          
          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
      }

      animationRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      observer.disconnect();
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [analyser, isPlaying]);

  return (
    <div ref={containerRef} className="relative w-full h-full min-h-[140px] md:min-h-[160px] bg-slate-900/60 rounded-xl overflow-hidden border border-white/5 shadow-inner">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />
      <div className="absolute top-2 right-3 pointer-events-none text-[10px] font-mono tracking-wider uppercase text-white/40 bg-slate-950/40 px-2 py-0.5 rounded border border-white/5">
        {analyser && isPlaying ? 'Spectrum active' : 'Ambient idle'}
      </div>
    </div>
  );
}

import { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { Loader2, Maximize2, X, ZoomIn, ZoomOut } from 'lucide-react';

let initialized = false;
function initMermaid() {
  if (initialized) return;
  initialized = true;
  mermaid.initialize({
    startOnLoad: false,
    theme: 'dark',
    securityLevel: 'strict',
    fontFamily: 'Inter, ui-sans-serif, system-ui',
    themeVariables: {
      // dark theme palette tuned to match the app
      darkMode: true,
      background: '#0d0e16',
      primaryColor: '#1c1d2b',
      primaryTextColor: '#e2e8f0',
      primaryBorderColor: '#7c3aed',
      lineColor: '#a78bfa',
      secondaryColor: '#171823',
      tertiaryColor: '#11121a',
      fontSize: '13px',
      classText: '#e2e8f0',
    },
  });
}

interface Props {
  source: string;
  /** id stem for the rendered SVG element */
  idStem?: string;
}

export function MermaidDiagram({ source, idStem = 'd' }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [zoomOpen, setZoomOpen] = useState(false);

  useEffect(() => {
    initMermaid();
    const id = `mer-${idStem}-${Math.random().toString(36).slice(2, 9)}`;
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const { svg: out } = await mermaid.render(id, source.trim());
        if (!cancelled) {
          setSvg(out);
          setError(null);
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [source, idStem]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-slate-500 text-sm gap-2">
        <Loader2 className="w-4 h-4 animate-spin" />
        Rendering diagram…
      </div>
    );
  }
  if (error) {
    return (
      <pre className="text-xs text-rose-300 bg-rose-500/10 p-3 rounded-md whitespace-pre-wrap">
        Mermaid error: {error}
      </pre>
    );
  }

  return (
    <>
      <div className="relative group">
        <div
          ref={containerRef}
          className="overflow-auto bg-bg-elev/40 rounded-lg p-4 border border-bg-border"
          dangerouslySetInnerHTML={{ __html: svg }}
        />
        <button
          onClick={() => setZoomOpen(true)}
          title="Expand diagram"
          className="absolute top-2 right-2 w-7 h-7 grid place-items-center rounded-md
                     bg-bg-elev/90 border border-bg-border text-slate-400 hover:text-white
                     opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      </div>
      {zoomOpen && <ZoomedDiagram svg={svg} onClose={() => setZoomOpen(false)} />}
    </>
  );
}

function ZoomedDiagram({ svg, onClose }: { svg: string; onClose: () => void }) {
  const [scale, setScale] = useState(1);
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/85 backdrop-blur-sm">
      <div className="absolute top-4 right-4 flex gap-2">
        <button
          onClick={() => setScale((s) => Math.max(0.4, s - 0.2))}
          className="w-9 h-9 grid place-items-center rounded-md bg-bg-elev border border-bg-border text-slate-300 hover:text-white"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={() => setScale((s) => Math.min(3, s + 0.2))}
          className="w-9 h-9 grid place-items-center rounded-md bg-bg-elev border border-bg-border text-slate-300 hover:text-white"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={onClose}
          className="w-9 h-9 grid place-items-center rounded-md bg-bg-elev border border-bg-border text-slate-300 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div
        className="max-w-[92vw] max-h-[88vh] overflow-auto p-4"
        onClick={onClose}
      >
        <div
          style={{ transform: `scale(${scale})`, transformOrigin: 'center center' }}
          onClick={(e) => e.stopPropagation()}
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      </div>
    </div>
  );
}

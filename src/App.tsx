import { useEffect, useRef, useState } from 'react';
import ImageEditor, { type ImageEditorRef } from '@unlayer/react-image-editor';
import { MODES, SAMPLES, type SampleGroup } from './data/samples.ts';

type Aspect = 'landscape' | 'portrait';
type SampleFilter = 'all' | 'landscape' | 'portrait' | SampleGroup;
type FrameId = 'none' | 'glow' | 'cinema' | 'corner-tag' | 'warm-matte' | 'grain';
type StudioStep = 1 | 2 | 3;

interface FormatOption {
  id: Aspect;
  label: string;
  detail: string;
  width: number;
  height: number;
}

const EDITOR_REPO = 'https://github.com/unlayer/react-image-editor';
const MAX_UPLOAD_BYTES = 12 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const FORMATS: FormatOption[] = [
  { id: 'landscape', label: '16:9', detail: 'Cinema / desktop', width: 1600, height: 900 },
  { id: 'portrait', label: '9:16', detail: 'Story / mobile', width: 900, height: 1600 },
];

const FRAMES: Array<{ id: FrameId; label: string; detail: string }> = [
  { id: 'none', label: 'No finish', detail: 'image only' },
  { id: 'glow', label: 'Soft glow', detail: 'lit edge' },
  { id: 'cinema', label: 'Cinema', detail: 'wide screen' },
  { id: 'corner-tag', label: 'Corner tag', detail: 'small marker' },
  { id: 'warm-matte', label: 'Warm matte', detail: 'paper tone' },
  { id: 'grain', label: 'Fine grain', detail: 'film texture' },
];

const DEFAULT_SAMPLE = SAMPLES[0]!;
const DEFAULT_MODE = MODES[0]!;
const DEFAULT_FORMAT = FORMATS[0]!;
const STUDIO_CACHE_KEY = 'leonida-studio-settings-v1';

interface StudioCache {
  step: StudioStep;
  sampleId: string;
  modeId: string;
  aspect: Aspect;
  frameId: FrameId;
  headline: string;
  subline: string;
  showWatermark: boolean;
  showStudioLabel: boolean;
  cornerTag: string;
  grainWeight: number;
}

interface RenderResult {
  key: string;
  dataUrl: string;
}

function loadStudioCache(): Partial<StudioCache> {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(STUDIO_CACHE_KEY) ?? '{}');
    if (!value || typeof value !== 'object') return {};
    const cache = value as Partial<StudioCache>;
    const restored: Partial<StudioCache> = {};
    if (cache.step === 1 || cache.step === 2 || cache.step === 3) restored.step = cache.step;
    const cachedSampleId = cache.sampleId;
    const hasCachedSample = typeof cachedSampleId === 'string' && SAMPLES.some((item) => item.id === cachedSampleId);
    if (hasCachedSample) restored.sampleId = cachedSampleId;
    if (typeof cache.modeId === 'string' && MODES.some((item) => item.id === cache.modeId)) restored.modeId = cache.modeId;
    if (cache.aspect === 'landscape' || cache.aspect === 'portrait') restored.aspect = cache.aspect;
    if (typeof cache.frameId === 'string' && FRAMES.some((item) => item.id === cache.frameId)) restored.frameId = cache.frameId as FrameId;
    if (typeof cache.headline === 'string') restored.headline = cache.headline;
    if (typeof cache.subline === 'string') restored.subline = cache.subline;
    if (typeof cache.showWatermark === 'boolean') restored.showWatermark = cache.showWatermark;
    if (typeof cache.showStudioLabel === 'boolean') restored.showStudioLabel = cache.showStudioLabel;
    if (typeof cache.cornerTag === 'string') restored.cornerTag = cache.cornerTag;
    if (typeof cache.grainWeight === 'number' && cache.grainWeight >= 0 && cache.grainWeight <= 100) restored.grainWeight = cache.grainWeight;
    if (cache.sampleId && !hasCachedSample) restored.step = 1;
    return restored;
  } catch {
    return {};
  }
}

const MODE_COLORS: Record<string, { accent: string; second: string }> = {
  wanted: { accent: '#e63946', second: '#171018' },
  ride: { accent: '#31d2c5', second: '#101f3a' },
  vice: { accent: '#9a70ff', second: '#36204e' },
  nightlife: { accent: '#42e6ff', second: '#251447' },
  'crew-card': { accent: '#f0c86e', second: '#1c1b21' },
  postcard: { accent: '#dd754b', second: '#d8c6a8' },
  'sunset-cover': { accent: '#ffd166', second: '#7a2e2e' },
  'night-drive': { accent: '#5587ff', second: '#101329' },
  'miami-noir': { accent: '#d2d5db', second: '#16181d' },
  poolside: { accent: '#ff8a70', second: '#b73f64' },
  'flash-report': { accent: '#64d879', second: '#123c29' },
  coastline: { accent: '#63d9df', second: '#126d77' },
};

function download(dataUrl: string, filename: string): void {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

function dataUrlToFile(dataUrl: string, filename: string): File {
  const [header, body] = dataUrl.split(',');
  if (!header || !body) throw new Error('Invalid image data.');
  const mime = header.match(/data:([^;]+);/)?.[1] ?? 'image/png';
  const binary = atob(body);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return new File([bytes], filename, { type: mime });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Image failed to load.'));
    image.src = src;
  });
}

function drawCoverImage(ctx: CanvasRenderingContext2D, image: HTMLImageElement, width: number, height: number): void {
  const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
  const drawWidth = image.naturalWidth * scale;
  const drawHeight = image.naturalHeight * scale;
  ctx.drawImage(image, (width - drawWidth) / 2, (height - drawHeight) / 2, drawWidth, drawHeight);
}

function fitText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, startingSize: number): string {
  let size = startingSize;
  while (size > 18) {
    ctx.font = `900 ${size}px Impact, Arial Narrow, sans-serif`;
    if (ctx.measureText(text).width <= maxWidth) return text;
    size -= 2;
  }
  return text;
}

function drawFrame(ctx: CanvasRenderingContext2D, width: number, height: number, pad: number, accent: string, frameId: FrameId, cornerTag: string, grainWeight: number): void {
  ctx.save();
  if (frameId === 'glow') {
    const glow = ctx.createRadialGradient(width / 2, height / 2, Math.min(width, height) * .18, width / 2, height / 2, Math.max(width, height) * .74);
    glow.addColorStop(.58, 'rgba(0,0,0,0)');
    glow.addColorStop(1, `${accent}66`);
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);
  }
  if (frameId === 'cinema') {
    const bar = Math.round(height * .065);
    ctx.fillStyle = 'rgba(12, 12, 14, .88)';
    ctx.fillRect(0, 0, width, bar);
    ctx.fillRect(0, height - bar, width, bar);
  }
  if (frameId === 'corner-tag') {
    ctx.fillStyle = accent;
    ctx.fillRect(pad, pad, 240, 42);
    ctx.fillStyle = '#171717';
    ctx.font = '700 17px Arial Narrow, Arial, sans-serif';
    ctx.fillText(cornerTag.trim() || 'LEONIDA / 001', pad + 13, pad + 27);
  }
  if (frameId === 'warm-matte') {
    ctx.fillStyle = 'rgba(242, 194, 128, .16)';
    ctx.fillRect(0, 0, width, height);
  }
  if (frameId === 'grain') {
    ctx.fillStyle = `rgba(246, 243, 234, ${.03 + grainWeight * .0014})`;
    for (let index = 0; index < 800 + grainWeight * 40; index += 1) {
      const x = (index * 73) % width;
      const y = (index * 137) % height;
      ctx.fillRect(x, y, 1, 1);
    }
  }
  ctx.restore();
}

async function renderVisual(imageSource: string, modeId: string, format: FormatOption, headline: string, subline: string, frameId: FrameId | null, showWatermark: boolean, showStudioLabel: boolean, cornerTag: string, grainWeight: number): Promise<string> {
  const image = await loadImage(imageSource);
  const canvas = document.createElement('canvas');
  canvas.width = format.width;
  canvas.height = format.height;
  const ctx = canvas.getContext('2d');
  const colors = MODE_COLORS[modeId] ?? MODE_COLORS.wanted;
  if (!ctx || !colors) throw new Error('Visual canvas unavailable.');

  drawCoverImage(ctx, image, canvas.width, canvas.height);
  ctx.fillStyle = 'rgba(10, 10, 16, .18)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, `${colors.second}b8`);
  gradient.addColorStop(.48, 'rgba(10, 10, 16, .05)');
  gradient.addColorStop(1, `${colors.accent}a3`);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const isPortrait = format.id === 'portrait';
  const pad = isPortrait ? 70 : 82;
  const title = headline.trim().toUpperCase();
  const caption = subline.trim().toUpperCase();
  const titleSize = isPortrait ? 112 : 110;

  if (frameId) drawFrame(ctx, canvas.width, canvas.height, pad, colors.accent, frameId, cornerTag, grainWeight);

  if (showStudioLabel) {
    ctx.fillStyle = colors.accent;
    ctx.fillRect(pad, pad, isPortrait ? 220 : 260, 16);
    ctx.font = '700 26px Arial Narrow, Arial, sans-serif';
    ctx.fillText('LEONIDA STUDIO / ' + (isPortrait ? 'STORY' : 'CINEMA'), pad, pad - 25);
  }

  const titleY = isPortrait ? canvas.height - 365 : canvas.height - 210;
  if (title) {
    ctx.fillStyle = '#f6f3ea';
    fitText(ctx, title, canvas.width - pad * 2 - 20, titleSize);
    ctx.fillText(title, pad + 20, titleY);
  }

  if (caption) {
    ctx.fillStyle = colors.accent;
    ctx.font = '700 28px Arial Narrow, Arial, sans-serif';
    ctx.fillText(caption, pad + 24, titleY + 55);
  }

  if (showWatermark) {
    ctx.fillStyle = '#f6f3ea';
    ctx.font = '700 22px Arial Narrow, Arial, sans-serif';
    ctx.fillText('BUILT WITH REACT IMAGE EDITOR', pad, canvas.height - pad + 46);
    ctx.fillStyle = colors.accent;
    ctx.fillRect(pad, canvas.height - pad + 72, canvas.width - pad * 2, 7);
  }

  return canvas.toDataURL('image/png');
}

export default function App() {
  const editorRef = useRef<ImageEditorRef | null>(null);
  const editorSectionRef = useRef<HTMLDivElement | null>(null);
  const [initialCache] = useState(loadStudioCache);
  const [step, setStep] = useState<StudioStep>(initialCache.step ?? 1);
  const [sampleId, setSampleId] = useState(initialCache.sampleId ?? 'jason-lucia');
  const [modeId, setModeId] = useState(initialCache.modeId ?? 'wanted');
  const [sampleGroup, setSampleGroup] = useState<SampleFilter>('all');
  const [aspect, setAspect] = useState<Aspect>(initialCache.aspect ?? 'landscape');
  const [frameId, setFrameId] = useState<FrameId>(initialCache.frameId ?? 'none');
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [headline, setHeadline] = useState(initialCache.headline ?? '');
  const [subline, setSubline] = useState(initialCache.subline ?? '');
  const [showWatermark, setShowWatermark] = useState(initialCache.showWatermark ?? true);
  const [showStudioLabel, setShowStudioLabel] = useState(initialCache.showStudioLabel ?? false);
  const [cornerTag, setCornerTag] = useState(initialCache.cornerTag ?? 'LEONIDA / 001');
  const [grainWeight, setGrainWeight] = useState(initialCache.grainWeight ?? 70);
  const [ready, setReady] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [result, setResult] = useState<RenderResult | null>(null);
  const [directionPreview, setDirectionPreview] = useState<RenderResult | null>(null);
  const [editorMinHeight, setEditorMinHeight] = useState(() => window.innerWidth < 700 ? 420 : 520);

  const sample = SAMPLES.find((item) => item.id === sampleId) ?? DEFAULT_SAMPLE;
  const mode = MODES.find((item) => item.id === modeId) ?? DEFAULT_MODE;
  const format = FORMATS.find((item) => item.id === aspect) ?? DEFAULT_FORMAT;
  const visibleSamples = sampleGroup === 'all' ? SAMPLES : sampleGroup === 'portrait' ? SAMPLES.filter((item) => item.orientation === 'portrait') : sampleGroup === 'landscape' ? SAMPLES.filter((item) => item.orientation !== 'portrait') : SAMPLES.filter((item) => item.group === sampleGroup);
  const activeImage = drafts[sampleId] ?? sample.src;
  const directionVisualKey = [activeImage, modeId, aspect, headline, subline, showWatermark, showStudioLabel].join('|');
  const finalVisualKey = [directionVisualKey, frameId, cornerTag, grainWeight].join('|');
  const finalImage = result?.key === finalVisualKey ? result.dataUrl : null;
  const directionImage = directionPreview?.key === directionVisualKey ? directionPreview.dataUrl : null;

  useEffect(() => {
    const updateEditorHeight = () => setEditorMinHeight(window.innerWidth < 700 ? 420 : 520);
    window.addEventListener('resize', updateEditorHeight);
    return () => window.removeEventListener('resize', updateEditorHeight);
  }, []);

  useEffect(() => {
    if (step !== 3) return;
    let cancelled = false;
    const renderKey = finalVisualKey;
    const timer = window.setTimeout(() => {
      void renderVisual(activeImage, modeId, format, headline, subline, frameId, showWatermark, showStudioLabel, cornerTag, grainWeight).then((nextResult) => {
        if (!cancelled) setResult({ key: renderKey, dataUrl: nextResult });
      }).catch(() => {
        if (!cancelled) setNotice('Final preview failed. Try another image.');
      });
    }, 150);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [activeImage, cornerTag, finalVisualKey, format, frameId, grainWeight, headline, modeId, showStudioLabel, showWatermark, step, subline]);

  useEffect(() => {
    if (step !== 2) return;
    let cancelled = false;
    const renderKey = directionVisualKey;
    const timer = window.setTimeout(() => {
      void renderVisual(activeImage, modeId, format, headline, subline, null, showWatermark, showStudioLabel, cornerTag, grainWeight).then((nextPreview) => {
        if (!cancelled) setDirectionPreview({ key: renderKey, dataUrl: nextPreview });
      }).catch(() => {
        if (!cancelled) setNotice('Direction preview failed. Try another image.');
      });
    }, 150);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [activeImage, cornerTag, directionVisualKey, format, grainWeight, headline, modeId, showStudioLabel, showWatermark, step, subline]);

  useEffect(() => {
    const cache: StudioCache = { step, sampleId, modeId, aspect, frameId, headline, subline, showWatermark, showStudioLabel, cornerTag, grainWeight };
    try {
      localStorage.setItem(STUDIO_CACHE_KEY, JSON.stringify(cache));
    } catch {
      // Storage can be disabled or full. Editor remains usable without cache.
    }
  }, [aspect, cornerTag, frameId, grainWeight, headline, modeId, sampleId, showStudioLabel, showWatermark, step, subline]);

  function pickSample(id: string): void {
    const currentEditor = editorRef.current?.editor;
    if (currentEditor?.hasChanges() === true) {
      const draft = currentEditor.getImage();
      if (draft) setDrafts((current) => ({ ...current, [sampleId]: draft }));
    }
    setSampleId(id);
    setReady(false);
    setNotice(null);
    requestAnimationFrame(() => editorSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }

  function uploadSample(file: File | undefined): void {
    if (!file) return;
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setNotice('Use a JPG, PNG, or WebP image.');
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      setNotice('Image must be smaller than 12 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== 'string') return;
      const uploadedId = 'upload-' + Date.now();
      setSampleId(uploadedId);
      setDrafts((current) => ({ ...current, [uploadedId]: reader.result as string }));
      setReady(false);
      setNotice('Uploaded image ready. Edit it below.');
      requestAnimationFrame(() => editorSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    };
    reader.onerror = () => setNotice('Image upload failed. Try again.');
    reader.readAsDataURL(file);
  }

  function saveDraft(dataUrl: string): void {
    setDrafts((current) => ({ ...current, [sampleId]: dataUrl }));
    setNotice('Image edit saved. Continue to directions.');
  }

  function persistEditorDraft(): void {
    const draft = editorRef.current?.editor?.getImage();
    if (draft) setDrafts((current) => ({ ...current, [sampleId]: draft }));
  }

  function goToStep(nextStep: StudioStep): void {
    if (step === 1 && nextStep !== 1) persistEditorDraft();
    setStep(nextStep);
    setNotice(null);
  }

  function continueToDirections(): void {
    goToStep(2);
  }

  async function shareResult(): Promise<void> {
    if (!finalImage) return;
    const shareText = `${headline || sample.label} / ${format.label} — #BuiltWithImageEditor`;
    try {
      if (navigator.share) {
        const file = dataUrlToFile(finalImage, 'leonida-' + aspect + '.png');
        if (navigator.canShare?.({ files: [file] })) {
          await navigator.share({ title: 'Leonida Studio', text: shareText, files: [file] });
        } else {
          await navigator.share({ title: 'Leonida Studio', text: shareText });
        }
        setNotice('Share sheet opened.');
      } else if (navigator.clipboard) {
        await navigator.clipboard?.writeText(shareText);
        setNotice('Share text copied.');
      } else {
        setNotice('Sharing unavailable. Download the PNG instead.');
      }
    } catch {
      setNotice('Share cancelled.');
    }
  }

  return (
    <div className="app-shell">
      <header className="site-header"><div className="site-header-inner">
        <a className="wordmark" href="#top" aria-label="Leonida Studio home"><span className="wordmark-mark">LS</span><span>Leonida Studio</span></a>
        <div className="header-meta"><span className="live-dot" aria-hidden="true" /><span>Vice City / Creative desk</span><a href={EDITOR_REPO} target="_blank" rel="noreferrer">Image editor ↗</a></div>
      </div></header>

      <main id="top" className="site-main">
        <section className="hero-grid">
          <div className="hero-copy"><p className="eyebrow">Build something worth seeing</p><h1>Make your mark<br /><em>in Leonida.</em></h1><p className="hero-lede">Edit image, set direction and dimensions, then take visual anywhere.</p><div className="hero-facts"><span>01 / Edit image</span><span>02 / Pick direction</span><span>03 / Set details</span></div></div>
          <div className="hero-art"><img className="hero-art-main" src="/samples/vice-motel.png" alt="Vice Motel scene" /><img className="hero-art-small" src="/samples/leonida-speedboat.png" alt="Leonida speedboat scene" /><div className="hero-stamp"><span className="stamp-small">LEONIDA / 001</span><strong>CREATE<br />YOUR FILE</strong></div></div>
        </section>

        <section className="studio-shell" aria-labelledby="studio-title">
          <div className="studio-heading"><div><p className="eyebrow">Leonida Studio / Image lab</p><h2 id="studio-title">Build your visual.</h2></div><p className="studio-note">{MODES.length} directions. Two formats. Full image editing. No account.</p></div>

          <div ref={editorSectionRef} className="workflow">
            <nav className="workflow-steps" aria-label="Build workflow">
              {(['Edit image', 'Pick direction', 'Set details'] as const).map((label, index) => { const target = (index + 1) as StudioStep; return <button key={label} type="button" aria-current={step === target ? 'step' : undefined} className={step === target ? 'is-active' : ''} onClick={() => goToStep(target)}><span>0{target}</span>{label}</button>; })}
            </nav>

            {step === 1 ? <section className="workflow-panel image-step" aria-labelledby="image-step-title">
              <div className="workflow-heading"><div><p className="editor-kicker">01 / Start here</p><h3 id="image-step-title">Edit your image.</h3></div><p>Crop, resize, filter, draw, and add stickers before styling scene.</p></div>
              <div className="editor-wrap">
                {!ready ? <div className="editor-loading" role="status">Loading image editor…</div> : null}
                <ImageEditor key={sampleId} ref={editorRef} image={activeImage} editorId="leonida-studio" options={{ theme: 'light' }} minHeight={editorMinHeight} onLoad={() => setReady(true)} onSave={({ dataUrl }) => saveDraft(dataUrl)} onCancel={() => setNotice('Edit cancelled.')} onLoadError={() => setNotice('Image failed to load.')} onError={() => setNotice('Editor failed to load. Check connection and reload.')} />
              </div>
              <div className="source-heading"><span>Choose source image</span><span>{visibleSamples.length} of {SAMPLES.length} files</span></div>
              <div className="source-tools"><div className="sample-filters" role="group" aria-label="Source image filters">{(['all', 'landscape', 'portrait', 'official', 'original'] as const).map((group) => <button key={group} type="button" onClick={() => setSampleGroup(group)} className={sampleGroup === group ? 'is-active' : ''}>{group === 'all' ? 'All dimensions' : group === 'landscape' ? '16:9 landscape' : group === 'portrait' ? '9:16 portrait' : group === 'official' ? 'Official media' : 'Original work'}</button>)}</div><label className="upload-button">Upload image<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => uploadSample(event.target.files?.[0])} /></label></div>
              <div className="sample-grid">{visibleSamples.map((item) => <button key={item.id} type="button" onClick={() => pickSample(item.id)} aria-pressed={item.id === sampleId} className={'sample-card ' + (item.id === sampleId ? 'is-active' : '')}><img src={drafts[item.id] ?? item.src} alt={item.label} /><p>{item.label}<span>{drafts[item.id] ? 'Draft saved · ' : ''}{item.hint}</span></p></button>)}</div>
              <div className="workflow-actions"><button type="button" className="workflow-button" onClick={continueToDirections}>Continue to directions</button></div>
            </section> : null}

            {step === 2 ? <section className="workflow-panel direction-step" aria-labelledby="direction-step-title">
              <div className="workflow-heading"><div><p className="editor-kicker">02 / Pick direction</p><h3 id="direction-step-title">Set visual direction.</h3></div><p>{mode.prompt}<strong>{mode.tools}</strong></p></div>
              <div className="direction-selection"><div className="direction-live-preview"><img src={directionPreview?.dataUrl ?? directionImage ?? activeImage} alt={'Live ' + mode.label + ' visual'} /><div><span>Live visual</span>{headline ? <strong>{headline}</strong> : null}<small>{format.label} · {mode.label}</small></div></div><div className="direction-grid" role="group" aria-label="Visual styles">{MODES.map((item, index) => <button key={item.id} type="button" aria-pressed={item.id === modeId} onClick={() => { setModeId(item.id); setNotice(null); }} className={'style-card ' + (item.id === modeId ? 'is-active' : '')}><span className="direction-swatch" style={{ backgroundColor: MODE_COLORS[item.id]?.accent }} /><span className="style-number">{String(index + 1).padStart(2, '0')}</span><span className="style-name">{item.label}</span><span className="style-tagline">{item.tagline}</span></button>)}</div></div>
              <div className="workflow-actions"><button type="button" className="workflow-button is-secondary" onClick={() => goToStep(1)}>Back to image</button><button type="button" className="workflow-button" onClick={() => goToStep(3)}>Continue to details</button></div>
            </section> : null}

            {step === 3 ? <section className="workflow-panel details-step" aria-labelledby="details-step-title">
              <div className="workflow-heading"><div><p className="editor-kicker">03 / Set details</p><h3 id="details-step-title">Give scene a headline.</h3></div><p>Choose dimensions, final frame, and text. Settings saved in this browser.</p></div>
              <div className="details-grid">
                <div><div className="detail-label"><span>Dimensions</span><small>{format.width} × {format.height}px</small></div><div className="format-options details-format" role="group" aria-label="Export aspect ratio">{FORMATS.map((item) => <button key={item.id} type="button" aria-pressed={item.id === aspect} className={item.id === aspect ? 'is-active' : ''} onClick={() => { setAspect(item.id); if (item.id === 'portrait') setSampleGroup('portrait'); else if (sampleGroup === 'portrait') setSampleGroup('all'); }}><span>{item.label}</span><small>{item.detail}</small></button>)}</div><label><span>Headline <i>optional</i></span><input value={headline} maxLength={35} placeholder="Add a headline" onChange={(event) => setHeadline(event.target.value)} /></label><label><span>Small line <i>optional</i></span><input value={subline} maxLength={42} placeholder="Add a small line" onChange={(event) => setSubline(event.target.value)} /></label></div>
                <div><div className="frame-picker"><span>Visual finish</span><div className="frame-options" role="group" aria-label="Visual finish">{FRAMES.map((frameOption) => <button key={frameOption.id} type="button" aria-pressed={frameOption.id === frameId} className={frameOption.id === frameId ? 'is-active' : ''} onClick={() => setFrameId(frameOption.id)}><strong>{frameOption.label}</strong><small>{frameOption.detail}</small></button>)}</div></div>{frameId === 'corner-tag' ? <label className="corner-tag-input"><span>Corner tag text</span><input value={cornerTag} maxLength={20} onChange={(event) => setCornerTag(event.target.value)} /></label> : null}{frameId === 'grain' ? <label className="grain-control"><span>Grain weight <b>{grainWeight}%</b></span><input type="range" min="0" max="100" value={grainWeight} onChange={(event) => setGrainWeight(Number(event.target.value))} /></label> : null}<label className="watermark-toggle"><input type="checkbox" checked={showStudioLabel} onChange={(event) => setShowStudioLabel(event.target.checked)} /><div className="watermark-copy"><strong>Studio label</strong><small>Top label and accent bar</small></div></label><label className="watermark-toggle"><input type="checkbox" checked={showWatermark} onChange={(event) => setShowWatermark(event.target.checked)} /><div className="watermark-copy"><strong>Watermark</strong><small>Build with React Image Editor</small></div></label></div>
              </div>
              <div className="details-preview"><img src={result?.dataUrl ?? finalImage ?? activeImage} alt="Final live visual" /></div>
              <div className="workflow-actions"><button type="button" className="workflow-button is-secondary" onClick={() => goToStep(2)}>Back to directions</button><button type="button" className="workflow-button" onClick={() => { if (finalImage) download(finalImage, 'leonida-' + aspect + '.png'); }} disabled={!finalImage}>Download PNG</button><button type="button" className="live-share-button" onClick={() => { void shareResult(); }} disabled={!finalImage}>Share image</button></div>
            </section> : null}
            {notice ? <p className="notice" role="status" aria-live="polite">{notice}</p> : null}
          </div>
        </section>

        <footer className="site-footer"><p>Leonida Studio — unofficial fan experience inspired by GTA VI.</p><p>Powered by <a href={EDITOR_REPO} target="_blank" rel="noreferrer">@unlayer/react-image-editor</a> · #BuiltWithImageEditor</p></footer>
      </main>
    </div>
  );
}

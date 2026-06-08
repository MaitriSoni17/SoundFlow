export const getStandaloneHTML = (): string => {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Offline Sequential Audio Player</title>
  <style>
    /* Premium Modern Minimalist Styling - Glassmorphism Slate */
    :root {
      --bg-gradient: radial-gradient(circle at 50% 0%, #0a0a0a 0%, #050505 100%);
      --accent: #22d3ee; /* Cyan */
      --accent-glowing: rgba(34, 211, 238, 0.4);
      --accent-cyan: #22d3ee; /* Cyan */
      --glass-bg: rgba(255, 255, 255, 0.03);
      --glass-border: rgba(255, 255, 255, 0.08);
      --glass-highlight: rgba(255, 255, 255, 0.03);
      --glass-text: rgba(248, 250, 252, 0.95);
      --glass-text-muted: rgba(148, 163, 184, 0.82);
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      scrollbar-width: thin;
      scrollbar-color: rgba(255, 255, 255, 0.1) transparent;
    }

    /* Track/Queue drag indicators */
    .draggable {
      cursor: grab;
      user-select: none;
    }
    .draggable.dragging {
      opacity: 0.4;
      background: rgba(34, 211, 238, 0.15) !important;
      border: 1px dashed var(--accent) !important;
    }

    /* Custom Webkit scrollbars */
    ::-webkit-scrollbar {
      width: 6px;
      height: 6px;
    }
    ::-webkit-scrollbar-track {
      background: transparent;
    }
    ::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.12);
      border-radius: 999px;
    }
    ::-webkit-scrollbar-thumb:hover {
      background: rgba(255, 255, 255, 0.25);
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: var(--bg-gradient);
      color: var(--glass-text);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 24px;
      overflow-x: hidden;
    }

    /* Decorative blurred glowing backdrops */
    .glow-orb-1 {
      position: fixed;
      top: -10%;
      left: 15%;
      width: 45vw;
      height: 45vw;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(34, 211, 238, 0.12) 0%, transparent 70%);
      filter: blur(60px);
      z-index: -1;
      pointer-events: none;
    }
    .glow-orb-2 {
      position: fixed;
      bottom: -10%;
      right: 15%;
      width: 50vw;
      height: 50vw;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(6, 182, 212, 0.15) 0%, transparent 70%);
      filter: blur(80px);
      z-index: -1;
      pointer-events: none;
    }

    main {
      width: 100%;
      max-width: 1040px;
      backdrop-filter: blur(24px);
      -webkit-backdrop-filter: blur(24px);
      background: var(--glass-bg);
      border: 1px solid var(--glass-border);
      border-radius: 24px;
      padding: 32px;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5), inset 0 1px 1px var(--glass-highlight);
      display: grid;
      grid-template-columns: 1.1fr 0.9fr;
      gap: 32px;
      z-index: 10;
    }

    @media (max-width: 868px) {
      main {
        grid-template-columns: 1fr;
        padding: 20px;
        gap: 24px;
      }
      body {
        padding: 12px;
      }
    }

    /* Headers */
    header {
      grid-column: 1 / -1;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      padding-bottom: 20px;
    }

    .brand h1 {
      font-size: 24px;
      font-weight: 700;
      letter-spacing: -0.5px;
      background: linear-gradient(135deg, #ffffff, #22d3ee);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .brand p {
      font-size: 13px;
      color: var(--glass-text-muted);
      margin-top: 4px;
    }

    .offline-tag {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      background: rgba(34, 211, 238, 0.1);
      color: var(--accent-cyan);
      padding: 4px 10px;
      border-radius: 999px;
      border: 1px solid rgba(34, 211, 238, 0.2);
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .shortcuts-tooltip-container {
      position: relative;
    }

    .shortcuts-help-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border-radius: 10px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: var(--glass-text-muted);
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .shortcuts-help-btn:hover {
      background: rgba(255, 255, 255, 0.12);
      color: var(--accent);
      border-color: rgba(34, 211, 238, 0.3);
    }

    .shortcuts-tooltip-content {
      position: absolute;
      top: 100%;
      right: 0;
      margin-top: 8px;
      width: 200px;
      background: rgba(10, 10, 10, 0.95);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 12px;
      padding: 12px;
      box-shadow: 0 15px 30px rgba(0, 0, 0, 0.5);
      opacity: 0;
      visibility: hidden;
      transform: translateY(-5px) scale(0.95);
      transform-origin: top right;
      transition: all 0.2s ease-in-out;
      z-index: 100;
      pointer-events: none;
    }

    .shortcuts-tooltip-container:hover .shortcuts-tooltip-content {
      opacity: 1;
      visibility: visible;
      transform: translateY(0) scale(1);
      pointer-events: auto;
    }

    .tooltip-header {
      display: flex;
      align-items: center;
      gap: 8px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      padding-bottom: 8px;
      margin-bottom: 8px;
    }

    .tooltip-header span {
      font-size: 11px;
      font-weight: 700;
      color: #fff;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .tooltip-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 6px;
    }

    .tooltip-row span {
      font-size: 11px;
      color: var(--glass-text-muted);
    }

    .tooltip-row kbd {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 4px;
      padding: 2px 6px;
      font-size: 10px;
      font-family: var(--font-mono);
      color: var(--accent);
      font-weight: bold;
    }

    .tooltip-footer {
      border-top: 1px solid rgba(255, 255, 255, 0.05);
      padding-top: 6px;
      margin-top: 6px;
      font-size: 9px;
      color: rgba(255, 255, 255, 0.3);
      text-align: right;
    }

    /* Left panel: Player UI */
    .player-panel {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .equalizer-container {
      width: 100%;
      height: 160px;
      background: rgba(15, 23, 42, 0.55);
      border-radius: 16px;
      position: relative;
      overflow: hidden;
      border: 1px solid rgba(255, 255, 255, 0.05);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .equalizer-canvas {
      width: 100%;
      height: 100%;
      display: block;
    }

    .metadata-display {
      text-align: center;
      padding: 12px 6px;
    }

    .current-title {
      font-size: 18px;
      font-weight: 600;
      color: #fff;
      white-space: nowrap;
      text-overflow: ellipsis;
      overflow: hidden;
      margin-bottom: 6px;
    }

    .current-artist {
      font-size: 13px;
      color: var(--glass-text-muted);
    }

    /* Time and Progress Slider */
    .progress-container {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .progress-bar-wrapper {
      position: relative;
      width: 100%;
      height: 6px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 999px;
      cursor: pointer;
    }

    .progress-loaded {
      position: absolute;
      top: 0;
      left: 0;
      height: 100%;
      width: 0%;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 999px;
    }

    .progress-fill {
      position: absolute;
      top: 0;
      left: 0;
      height: 100%;
      width: 0%;
      background: linear-gradient(90deg, var(--accent), var(--accent-cyan));
      border-radius: 999px;
      box-shadow: 0 0 10px rgba(192, 132, 252, 0.5);
    }

    .time-indicators {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      font-family: monospace;
      color: var(--glass-text-muted);
    }

    /* Audio Buttons & Controls */
    .controls-wrapper {
      display: flex;
      flex-direction: column;
      gap: 16px;
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(255, 255, 255, 0.04);
      padding: 16px;
      border-radius: 16px;
    }

    .playback-row {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 20px;
    }

    .volume-row {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 0 10px;
    }

    button {
      background: transparent;
      border: none;
      color: var(--glass-text);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
      border-radius: 50%;
    }

    button:hover {
      color: #fff;
    }

    /* Icon button wrappers for styling */
    .btn-secondary {
      width: 40px;
      height: 40px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.04);
    }
    .btn-secondary:hover {
      background: rgba(255, 255, 255, 0.12);
      transform: scale(1.05);
    }
    .btn-secondary.active {
      background: rgba(34, 211, 238, 0.15);
      border-color: rgba(34, 211, 238, 0.4);
      color: var(--accent);
      box-shadow: 0 0 15px rgba(34, 211, 238, 0.1);
    }

    .btn-skip {
      width: 44px;
      height: 44px;
      background: rgba(255, 255, 255, 0.03);
    }
    .btn-skip:hover {
      background: rgba(255, 255, 255, 0.1);
      transform: scale(1.05);
    }
    .btn-skip:active {
      transform: scale(0.95);
    }

    .btn-play-pause {
      width: 60px;
      height: 60px;
      background: var(--accent);
      box-shadow: 0 8px 24px rgba(34, 211, 238, 0.35);
      color: #000;
    }
    .btn-play-pause:hover {
      transform: scale(1.08);
      box-shadow: 0 8px 28px rgba(34, 211, 238, 0.5), 0 0 10px rgba(34, 211, 238, 0.4);
    }
    .btn-play-pause:active {
      transform: scale(0.96);
    }

    /* Range inputs (Volume slider) */
    .volume-slider-wrapper {
      position: relative;
      flex-grow: 1;
      height: 4px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 999px;
      cursor: pointer;
    }
    .volume-fill {
      position: absolute;
      top: 0;
      left: 0;
      height: 100%;
      width: 80%;
      background: var(--accent-cyan);
      border-radius: 999px;
    }

    /* Right panel: Playlist UI */
    .playlist-panel {
      display: flex;
      flex-direction: column;
      gap: 16px;
      height: 100%;
      max-height: 470px;
    }

    /* Custom Input Loader Area */
    .drop-zone {
      border: 2px dashed rgba(255, 255, 255, 0.12);
      border-radius: 16px;
      padding: 24px 16px;
      text-align: center;
      transition: all 0.25s ease;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
      background: rgba(255, 255, 255, 0.01);
    }

    .drop-zone:hover, .drop-zone.dragover {
      border-color: var(--accent);
      background: rgba(34, 211, 238, 0.04);
    }

    .drop-zone p {
      font-size: 13px;
      color: var(--glass-text-muted);
    }

    .drop-zone-icon {
      color: var(--accent);
      opacity: 0.8;
      width: 40px;
      height: 40px;
    }

    .browse-btn {
      font-size: 12px;
      font-weight: 600;
      color: #fff;
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.08);
      padding: 6px 14px;
      border-radius: 6px;
      margin-top: 4px;
      cursor: pointer;
      display: inline-block;
      transition: all 0.2s;
    }
    .browse-btn:hover {
      background: rgba(255, 255, 255, 0.12);
    }

    #file-input {
      display: none;
    }

    /* Track list */
    .track-list-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 4px 0;
    }

    .track-list-header h3 {
      font-size: 15px;
      font-weight: 600;
    }

    .clear-btn {
      font-size: 12px;
      color: #ef4444;
      background: transparent;
      border: none;
      cursor: pointer;
      opacity: 0.85;
      display: flex;
      align-items: center;
      gap: 4px;
      border-radius: 4px;
      padding: 2px 6px;
    }
    .clear-btn:hover {
      opacity: 1;
      background: rgba(239, 68, 68, 0.1);
    }

    /* Toggle switch for standalone backup */
    .standalone-backup-panel {
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 12px;
      padding: 12px;
      margin-bottom: 16px;
    }
    .backup-btn-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      margin-bottom: 10px;
    }
    .backup-sub-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
      padding: 6px 10px;
      font-size: 11px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      color: #fff;
      font-weight: 500;
      cursor: pointer;
      text-align: center;
      outline: none;
      transition: border-color 0.2s, background-color 0.2s;
    }
    .backup-sub-btn:hover {
      border-color: rgba(34, 211, 238, 0.3);
      background: rgba(34, 211, 238, 0.05);
    }
    .toggle-container {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-top: 1px solid rgba(255, 255, 255, 0.05);
      padding-top: 8px;
    }
    .toggle-switch {
      position: relative;
      display: inline-block;
      width: 32px;
      height: 18px;
    }
    .toggle-switch input {
      opacity: 0;
      width: 0;
      height: 0;
    }
    .toggle-slider {
      position: absolute;
      cursor: pointer;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(255, 255, 255, 0.1);
      transition: .2s;
      border-radius: 9px;
    }
    .toggle-slider:before {
      position: absolute;
      content: "";
      height: 14px;
      width: 14px;
      left: 2px;
      bottom: 2px;
      background-color: white;
      transition: .2s;
      border-radius: 50%;
    }
    input:checked + .toggle-slider {
      background-color: #22d3ee;
    }
    input:checked + .toggle-slider:before {
      transform: translateX(14px);
    }

    #standalone-search-input:focus {
      border-color: rgba(34, 211, 238, 0.45) !important;
      box-shadow: 0 0 8px rgba(34, 211, 238, 0.15);
    }

    .queue-list-wrapper {
      flex-grow: 1;
      overflow-y: auto;
      max-height: 280px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding-right: 2px;
    }

    .track-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 10px 14px;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.04);
      border-radius: 12px;
      font-size: 13.5px;
      transition: all 0.2s ease;
    }

    .track-item:hover {
      background: rgba(255, 255, 255, 0.07);
    }

    .track-item.active {
      background: rgba(34, 211, 238, 0.08);
      border-color: rgba(34, 211, 238, 0.25);
      border-left: 3px solid var(--accent);
      padding-left: 11px;
      border-radius: 0 12px 12px 0;
    }

    .track-info-group {
      display: flex;
      align-items: center;
      gap: 10px;
      overflow: hidden;
      flex-grow: 1;
    }

    .track-number {
      font-family: monospace;
      color: var(--glass-text-muted);
      width: 18px;
    }

    .track-item.active .track-number {
      color: var(--accent);
      font-weight: bold;
    }

    .track-title-name {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      color: var(--glass-text);
    }

    .track-item.active .track-title-name {
      color: #fff;
      font-weight: 500;
    }

    .track-meta-right {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 11px;
      color: var(--glass-text-muted);
      font-family: monospace;
    }

    .delete-track-btn {
      color: var(--glass-text-muted);
      cursor: pointer;
      opacity: 0.6;
      background: transparent;
      border: none;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 5px;
      padding: 4px;
    }

    .delete-track-btn:hover {
      color: #ef4444;
      opacity: 1;
      background: rgba(239, 68, 68, 0.08);
    }

    .empty-queue {
      flex-grow: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: var(--glass-text-muted);
      font-size: 13px;
      gap: 12px;
      min-height: 150px;
      background: rgba(255, 255, 255, 0.01);
      border: 1.5px dashed rgba(255, 255, 255, 0.05);
      border-radius: 12px;
    }

    .empty-icon {
      opacity: 0.3;
      width: 32px;
      height: 32px;
    }
  </style>
</head>
<body>

  <div class="glow-orb-1"></div>
  <div class="glow-orb-2"></div>

  <main>
    <header>
      <div class="brand">
        <h1>
          <!-- Sound wave head logo in inline SVG -->
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--accent)"><path d="M12 2v20M17 5v14M22 9v6M7 7v10M2 10v4"/></svg>
          SoundFlow
        </h1>
        <p>Offline Sequential Audio Player</p>
      </div>
      <div class="header-actions">
        <!-- Keyboard Shortcuts Help Tooltip -->
        <div class="shortcuts-tooltip-container">
          <button class="shortcuts-help-btn" aria-label="Keyboard Shortcuts">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" ry="2"/><line x1="6" y1="8" x2="6" y2="8"/><line x1="10" y1="8" x2="10" y2="8"/><line x1="14" y1="8" x2="14" y2="8"/><line x1="18" y1="8" x2="18" y2="8"/><line x1="6" y1="12" x2="6" y2="12"/><line x1="10" y1="12" x2="14" y2="12"/><line x1="18" y1="12" x2="18" y2="12"/><line x1="7" y1="16" x2="17" y2="16"/></svg>
          </button>
          <div class="shortcuts-tooltip-content">
            <div class="tooltip-header">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--accent)"><rect x="2" y="4" width="20" height="16" rx="2" ry="2"/><line x1="6" y1="8" x2="6" y2="8"/><line x1="10" y1="8" x2="10" y2="8"/><line x1="14" y1="8" x2="14" y2="8"/><line x1="18" y1="8" x2="18" y2="8"/><line x1="6" y1="12" x2="6" y2="12"/><line x1="10" y1="12" x2="14" y2="12"/><line x1="18" y1="12" x2="18" y2="12"/><line x1="7" y1="16" x2="17" y2="16"/></svg>
              <span>Shortcuts</span>
            </div>
            <div class="tooltip-row">
              <span>Play / Pause</span>
              <kbd>Space</kbd>
            </div>
            <div class="tooltip-row">
              <span>Next Track</span>
              <kbd>➔</kbd>
            </div>
            <div class="tooltip-row">
              <span>Previous Track</span>
              <kbd>←</kbd>
            </div>
            <div class="tooltip-footer">
              Works when not typing in inputs.
            </div>
          </div>
        </div>
        <span class="offline-tag">100% Offline</span>
      </div>
    </header>

    <!-- Player Side -->
    <section class="player-panel">
      <div class="equalizer-container">
        <canvas id="eq-canvas" class="equalizer-canvas"></canvas>
      </div>

      <div class="metadata-display">
        <div id="active-title" class="current-title">No Audio Loaded</div>
        <div id="active-size" class="current-artist">Select audio files on the right to start</div>
      </div>

      <div class="progress-container">
        <div id="seek-wrapper" class="progress-bar-wrapper">
          <div id="seek-loaded" class="progress-loaded"></div>
          <div id="seek-fill" class="progress-fill"></div>
        </div>
        <div class="time-indicators">
          <span id="time-current">0:00</span>
          <span id="time-total">0:00</span>
        </div>
      </div>

      <div class="controls-wrapper">
        <div class="playback-row">
          <!-- Shuffle Button -->
          <button id="btn-shuffle" class="btn-secondary" title="Shuffle playback">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6M9 20l12-12M21 3l-12 12M3 21h6M20 15v6h-6M3 3l6 6"/></svg>
          </button>

          <!-- Back Button -->
          <button id="btn-prev" class="btn-skip" title="Previous track">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="19 20 9 12 19 4 19 20"/><line x1="5" y1="19" x2="5" y2="5"/></svg>
          </button>

          <!-- Play/Pause Button -->
          <button id="btn-play" class="btn-play-pause" title="Play / Pause">
            <svg id="play-icon" width="26" height="26" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          </button>

          <!-- Next Button -->
          <button id="btn-next" class="btn-skip" title="Next track">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="5" x2="19" y2="19"/></svg>
          </button>

          <!-- Loop Mode Button -->
          <button id="btn-repeat" class="btn-secondary" title="Repeat (Off)">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/></svg>
          </button>
        </div>

        <div class="volume-row">
          <button id="btn-mute" title="Volume">
            <svg id="volume-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H2v6h4l5 4V5z"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
          </button>
          <div id="volume-wrapper" class="volume-slider-wrapper">
            <div id="volume-fill" class="volume-fill"></div>
          </div>
        </div>
      </div>
    </section>

    <!-- Playlist / Loading Side -->
    <section class="playlist-panel">
      <div id="drop-zone" class="drop-zone">
        <svg class="drop-zone-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
        <div>
          <p>Drag & drop audio files here</p>
          <p style="font-size: 11px; margin-top: 2px;">Supports MP3, WAV, OGG, FLAC, M4A, etc.</p>
        </div>
        <label class="browse-btn">
          Select Files
          <input type="file" id="file-input" multiple accept="audio/*">
        </label>
      </div>

      <div class="track-list-container">
        <div class="track-list-header">
          <h3>Play Queue</h3>
          <button id="btn-clear" class="clear-btn" title="Clear all tracks">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
            Clear Queue
          </button>
        </div>
        <div class="search-box-container" id="standalone-search-container" style="display: none; position: relative; margin-bottom: 12px;">
          <input type="text" id="standalone-search-input" placeholder="Search songs..." style="width: 100%; box-sizing: border-box; padding: 8px 12px 8px 32px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; color: #fff; font-size: 11px; outline: none; transition: border-color 0.2s;">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="position: absolute; left: 10px; top: 10px; color: rgba(255,255,255,0.4); pointer-events: none;"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <button id="btn-clear-search" style="position: absolute; right: 10px; top: 7px; background: none; border: none; color: rgba(255,255,255,0.4); cursor: pointer; display: none; align-items: center; justify-content: center; height: 18px; width: 18px; padding: 0; font-size: 14px;">&times;</button>
        </div>
        <div id="queue-list" class="queue-list-wrapper">
          <div class="empty-queue">
            <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
            <span>No audio files loaded yet</span>
          </div>
        </div>
      </div>
    </section>
  </main>

  <script>
    // Pure Vanilla JS Offline Engine
    let playQueue = [];
    let currentIndex = parseInt(localStorage.getItem('soundflow_current_index') || '-1', 10);
    let isPlaying = false;
    let volume = parseFloat(localStorage.getItem('soundflow_volume') || '0.8');
    let isMuted = localStorage.getItem('soundflow_is_muted') === 'true';
    let loopMode = localStorage.getItem('soundflow_loop_mode') || 'none'; // 'none', 'all', 'one'
    let isShuffle = localStorage.getItem('soundflow_is_shuffle') === 'true';
    let shuffledIndices = [];
    let savedProgress = parseFloat(localStorage.getItem('soundflow_current_time') || '0');
    
    // Core HTML Audio instance
    const audioNode = new Audio();

    // Context & nodes for real audio visualizer
    let audioCtx = null;
    let analyserNode = null;
    let sourceNode = null;

    // IndexedDB setup for the Offline Standalone App
    const DB_NAME = 'soundflow-standalone-db';
    const STORE_NAME = 'standalone-tracks';

    function initStandaloneDB() {
      return new Promise((resolve) => {
        const req = indexedDB.open(DB_NAME, 1);
        req.onupgradeneeded = (e) => {
          const db = e.target.result;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          }
        };
        req.onsuccess = (e) => resolve(e.target.result);
        req.onerror = () => resolve(null);
      });
    }

    async function saveTrackStandalone(id, blob, name) {
      const db = await initStandaloneDB();
      if (!db) return;
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put({ id, blob, name });
    }

    async function getTrackStandalone(id) {
      const db = await initStandaloneDB();
      if (!db) return null;
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const req = tx.objectStore(STORE_NAME).get(id);
        req.onsuccess = () => resolve(req.result ? req.result.blob : null);
        req.onerror = () => resolve(null);
      });
    }

    async function deleteTrackStandalone(id) {
      const db = await initStandaloneDB();
      if (!db) return;
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).delete(id);
    }

    async function clearTracksStandalone() {
      const db = await initStandaloneDB();
      if (!db) return;
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).clear();
    }

    function saveTracksMetadataToLocalStorage() {
      const metaList = playQueue.map(item => ({
        id: item.id,
        name: item.name,
        size: item.size,
        type: item.type || 'audio/mp3',
        duration: item.duration || 0
      }));
      localStorage.setItem('soundflow_tracks_metadata', JSON.stringify(metaList));
      localStorage.setItem('soundflow_current_index', currentIndex);
    }

    // DOM Elements Cache
    const elFile = document.getElementById('file-input');
    const elDropZone = document.getElementById('drop-zone');
    const elQueue = document.getElementById('queue-list');
    const elClear = document.getElementById('btn-clear');
    
    const elPlayBtn = document.getElementById('btn-play');
    const elPlayIcon = document.getElementById('play-icon');
    const elPrevBtn = document.getElementById('btn-prev');
    const elNextBtn = document.getElementById('btn-next');
    const elShuffleBtn = document.getElementById('btn-shuffle');
    const elRepeatBtn = document.getElementById('btn-repeat');
    
    const elMuteBtn = document.getElementById('btn-mute');
    const elVolumeIcon = document.getElementById('volume-icon');
    const elVolumeWrapper = document.getElementById('volume-wrapper');
    const elVolumeFill = document.getElementById('volume-fill');
    
    const elSeekWrapper = document.getElementById('seek-wrapper');
    const elSeekFill = document.getElementById('seek-fill');
    const elTimeCurrent = document.getElementById('time-current');
    const elTimeTotal = document.getElementById('time-total');
    
    const elTitle = document.getElementById('active-title');
    const elSizeInfo = document.getElementById('active-size');
    const elCanvas = document.getElementById('eq-canvas');
    const eqCtx = elCanvas.getContext('2d');

    // Drag-and-Drop Playlist State
    let dragSourceElement = null;

    // Audio node configuration
    audioNode.volume = volume;

    // Initialize Canvas Dimensions properly
    function setupCanvas() {
      const dpr = window.devicePixelRatio || 1;
      const rect = elCanvas.getBoundingClientRect();
      elCanvas.width = rect.width * dpr;
      elCanvas.height = rect.height * dpr;
      eqCtx.scale(dpr, dpr);
    }
    setupCanvas();
    window.addEventListener('resize', setupCanvas);

    // Modern Simulated Visualizer Wave when idle, and Real wave when playing
    let animationId = null;
    let phase = 0;

    function drawVisualizer() {
      const dpr = window.devicePixelRatio || 1;
      const width = elCanvas.width / dpr;
      const height = elCanvas.height / dpr;

      // Draw subtle dark blue trails
      eqCtx.fillStyle = 'rgba(15, 23, 42, 0.2)';
      eqCtx.fillRect(0, 0, width, height);

      if (analyserNode && isPlaying && !audioNode.paused) {
        // Real active visualizer from AudioContext
        const bufferLength = analyserNode.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyserNode.getByteFrequencyData(dataArray);

        const barWidth = (width / bufferLength) * 1.6;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const barHeight = (dataArray[i] / 255) * height * 0.85;

          const gradient = eqCtx.createLinearGradient(0, height, 0, height - barHeight);
          gradient.addColorStop(0, 'rgba(8, 145, 178, 0.9)'); // Teal
          gradient.addColorStop(0.5, 'rgba(6, 182, 212, 0.7)'); // Cyan
          gradient.addColorStop(1, 'rgba(34, 211, 238, 0.95)');  // Bright Cyan

          eqCtx.fillStyle = gradient;
          eqCtx.beginPath();
          eqCtx.roundRect(x, height - barHeight, barWidth - 2, barHeight, [4, 4, 0, 0]);
          eqCtx.fill();

          x += barWidth;
        }
      } else {
        // Ambient Wave Visualizer (when paused or empty)
        eqCtx.beginPath();
        eqCtx.lineWidth = 2.5;

        const gradient = eqCtx.createLinearGradient(0, 0, width, 0);
        gradient.addColorStop(0, 'rgba(6, 182, 212, 0.1)');
        gradient.addColorStop(0.5, 'rgba(34, 211, 238, 0.5)');
        gradient.addColorStop(1, 'rgba(6, 182, 212, 0.1)');
        eqCtx.strokeStyle = gradient;

        phase += isPlaying ? 0.08 : 0.03;
        for (let i = 0; i < width; i++) {
          const amplitude = isPlaying ? 24 : 10;
          const y = height / 2 + Math.sin(i * 0.007 + phase) * amplitude + Math.cos(i * 0.012 - phase) * (amplitude/3);
          if (i === 0) {
            eqCtx.moveTo(i, y);
          } else {
            eqCtx.lineTo(i, y);
          }
        }
        eqCtx.stroke();
      }

      animationId = requestAnimationFrame(drawVisualizer);
    }
    drawVisualizer();

    // Lazy initialization of Web Audio API
    function initWebAudio() {
      if (audioCtx) return;
      try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        analyserNode = audioCtx.createAnalyser();
        analyserNode.fftSize = 128;
        sourceNode = audioCtx.createMediaElementSource(audioNode);
        sourceNode.connect(analyserNode);
        analyserNode.connect(audioCtx.destination);
      } catch (e) {
        console.warn('AudioContext failed:', e);
      }
    }

    // Helper functions
    function formatTime(secs) {
      if (isNaN(secs)) return '0:00';
      const m = Math.floor(secs / 60);
      const s = Math.floor(secs % 60).toString().padStart(2, '0');
      return \`\${m}:\${s}\`;
    }

    function formatSize(bytes) {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const dm = 1;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    // Load Track and Play
    function loadAndPlayTrack(index, forcePlay = true) {
      if (index < 0 || index >= playQueue.length) return;
      
      // Stop ongoing play
      audioNode.pause();

      currentIndex = index;
      localStorage.setItem('soundflow_current_index', currentIndex);
      const track = playQueue[currentIndex];
      
      audioNode.src = track.url;
      elTitle.innerText = track.name;
      elSizeInfo.innerText = \`Offline Audio file \u2022 \${formatSize(track.size)}\`;

      updateActiveTrackStyles();
      
      audioNode.load();

      if (forcePlay) {
        initWebAudio();
        if (audioCtx && audioCtx.state === 'suspended') {
          audioCtx.resume();
        }
        audioNode.play().then(() => {
          isPlaying = true;
          updatePlayUI();
        }).catch(err => {
          console.warn('Playback failed:', err);
          isPlaying = false;
          updatePlayUI();
        });
      } else {
        isPlaying = false;
        updatePlayUI();
      }
    }

    // UI Updates
    function updatePlayUI() {
      if (isPlaying) {
        // Pause icon representation (2 bars SVG)
        elPlayIcon.innerHTML = '<rect x="6" y="4" width="4" height="16" fill="currentColor"/><rect x="14" y="4" width="4" height="16" fill="currentColor"/>';
      } else {
        // Play icon representation (polygon play SVG)
        elPlayIcon.innerHTML = '<polygon points="6 3 20 12 6 21 6 3" fill="currentColor"/>';
      }
    }

    function updateActiveTrackStyles() {
      document.querySelectorAll('.track-item').forEach((item, index) => {
        if (index === currentIndex) {
          item.classList.add('active');
          item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        } else {
          item.classList.remove('active');
        }
      });
    }

    function updateVolumeUI() {
      const percent = isMuted ? 0 : volume * 100;
      elVolumeFill.style.width = percent + '%';
      audioNode.volume = isMuted ? 0 : volume;

      localStorage.setItem('soundflow_volume', volume.toString());
      localStorage.setItem('soundflow_is_muted', isMuted ? 'true' : 'false');

      if (isMuted || volume === 0) {
        elVolumeIcon.innerHTML = '<path d="M11 5 6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>';
      } else if (volume < 0.5) {
        elVolumeIcon.innerHTML = '<path d="M11 5 6 9H2v6h4l5 4V5z"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>';
      } else {
        elVolumeIcon.innerHTML = '<path d="M11 5 6 9H2v6h4l5 4V5z"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>';
      }
    }

    // Playback state machines
    function playPause() {
      if (playQueue.length === 0) return;
      if (currentIndex === -1) {
        loadAndPlayTrack(0);
        return;
      }

      initWebAudio();
      if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
      }

      if (audioNode.paused) {
        audioNode.play().then(() => {
          isPlaying = true;
          updatePlayUI();
        });
      } else {
        audioNode.pause();
        isPlaying = false;
        updatePlayUI();
      }
    }

    function skipNext() {
      if (playQueue.length === 0) return;

      if (loopMode === 'one' && currentIndex !== -1) {
        // If repeat one is on and user manually shifts next, play next track anyway
        let nextIdx = currentIndex + 1;
        if (nextIdx >= playQueue.length) nextIdx = 0;
        loadAndPlayTrack(nextIdx);
        return;
      }

      if (isShuffle) {
        playNextShuffle();
        return;
      }

      let nextIndex = currentIndex + 1;
      if (nextIndex >= playQueue.length) {
        if (loopMode === 'all') {
          nextIndex = 0;
        } else {
          // End of queue and no looping
          return;
        }
      }
      loadAndPlayTrack(nextIndex);
    }

    function skipPrev() {
      if (playQueue.length === 0) return;

      if (audioNode.currentTime > 3.5) {
        // Reset current track if played past 3.5 seconds
        audioNode.currentTime = 0;
        return;
      }

      if (isShuffle && shuffledIndices.length > 0) {
        playPrevShuffle();
        return;
      }

      let prevIndex = currentIndex - 1;
      if (prevIndex < 0) {
        if (loopMode === 'all') {
          prevIndex = playQueue.length - 1;
        } else {
          prevIndex = 0;
        }
      }
      loadAndPlayTrack(prevIndex);
    }

    function toggleShuffle() {
      isShuffle = !isShuffle;
      localStorage.setItem('soundflow_is_shuffle', isShuffle ? 'true' : 'false');
      if (isShuffle) {
        elShuffleBtn.classList.add('active');
        generateShuffleQueue();
      } else {
        elShuffleBtn.classList.remove('active');
        shuffledIndices = [];
      }
    }

    function generateShuffleQueue() {
      shuffledIndices = Array.from({length: playQueue.length}, (_, i) => i);
      // Knuth-Fisher-Yates Shuffle
      for (let i = shuffledIndices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledIndices[i], shuffledIndices[j]] = [shuffledIndices[j], shuffledIndices[i]];
      }
      // Keep current track first in shuffle trace if playing
      if (currentIndex !== -1) {
        shuffledIndices = shuffledIndices.filter(idx => idx !== currentIndex);
        shuffledIndices.unshift(currentIndex);
      }
    }

    function playNextShuffle() {
      if (shuffledIndices.length === 0) generateShuffleQueue();
      const currentShufflePos = shuffledIndices.indexOf(currentIndex);
      let nextShufflePos = currentShufflePos + 1;

      if (nextShufflePos >= shuffledIndices.length) {
        if (loopMode === 'all') {
          generateShuffleQueue();
          nextShufflePos = 0;
        } else {
          return; // Stop playlist
        }
      }
      loadAndPlayTrack(shuffledIndices[nextShufflePos]);
    }

    function playPrevShuffle() {
      if (shuffledIndices.length === 0) generateShuffleQueue();
      const currentShufflePos = shuffledIndices.indexOf(currentIndex);
      let prevShufflePos = currentShufflePos - 1;

      if (prevShufflePos < 0) {
        if (loopMode === 'all') {
          prevShufflePos = shuffledIndices.length - 1;
        } else {
          prevShufflePos = 0;
        }
      }
      loadAndPlayTrack(shuffledIndices[prevShufflePos]);
    }

    function toggleRepeat() {
      if (loopMode === 'none') {
        loopMode = 'all';
        elRepeatBtn.title = 'Repeat (All)';
        elRepeatBtn.classList.add('active');
        elRepeatBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/></svg>';
      } else if (loopMode === 'all') {
        loopMode = 'one';
        elRepeatBtn.title = 'Repeat (One)';
        elRepeatBtn.classList.add('active');
        elRepeatBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/><path d="M11 10h1v4"/><path d="M10 14h3"/></svg>'; // Standard loop SVG with indicator inner 1
      } else {
        loopMode = 'none';
        elRepeatBtn.title = 'Repeat (Off)';
        elRepeatBtn.classList.remove('active');
        elRepeatBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/></svg>';
      }
      localStorage.setItem('soundflow_loop_mode', loopMode);
    }

    // Audio node lifecycle hooks
    audioNode.addEventListener('timeupdate', () => {
      const cur = audioNode.currentTime;
      const dur = audioNode.duration;
      if (isNaN(dur)) return;
      
      const percent = (cur / dur) * 100;
      elSeekFill.style.width = percent + '%';
      elTimeCurrent.innerText = formatTime(cur);
      localStorage.setItem('soundflow_current_time', cur.toString());
    });

    audioNode.addEventListener('durationchange', () => {
      elTimeTotal.innerText = formatTime(audioNode.duration);
    });

    audioNode.addEventListener('progress', () => {
      if (audioNode.buffered.length > 0) {
        const bufferedEnd = audioNode.buffered.end(audioNode.buffered.length - 1);
        const duration = audioNode.duration;
        if (duration > 0) {
          elSeekLoaded.style.width = \`\${(bufferedEnd / duration) * 100}%\`;
        }
      }
    });

    // Auto Advance sequential loop triggers
    audioNode.addEventListener('ended', () => {
      if (loopMode === 'one') {
        audioNode.currentTime = 0;
        audioNode.play();
      } else {
        skipNext();
      }
    });

    // Seek interaction
    elSeekWrapper.addEventListener('click', (e) => {
      if (playQueue.length === 0) return;
      const rect = elSeekWrapper.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const width = rect.width;
      const clickPercent = clickX / width;
      
      if (!isNaN(audioNode.duration)) {
        audioNode.currentTime = clickPercent * audioNode.duration;
      }
    });

    // Volume Interaction
    function setVolumeFromEvent(e) {
      const rect = elVolumeWrapper.getBoundingClientRect();
      let clickX = e.clientX - rect.left;
      if (clickX < 0) clickX = 0;
      if (clickX > rect.width) clickX = rect.width;
      volume = clickX / rect.width;
      isMuted = false;
      updateVolumeUI();
    }

    let isVolDragging = false;
    elVolumeWrapper.addEventListener('mousedown', (e) => {
      isVolDragging = true;
      setVolumeFromEvent(e);
    });

    document.addEventListener('mousemove', (e) => {
      if (isVolDragging) setVolumeFromEvent(e);
    });

    document.addEventListener('mouseup', () => {
      isVolDragging = false;
    });

    elMuteBtn.addEventListener('click', () => {
      isMuted = !isMuted;
      updateVolumeUI();
    });

    // Standalone playlist search wiring
    const elSearchInput = document.getElementById('standalone-search-input');
    const elClearSearch = document.getElementById('btn-clear-search');

    if (elSearchInput) {
      elSearchInput.addEventListener('input', () => {
        rebuildPlaylistQueueUI();
      });
    }

    if (elClearSearch) {
      elClearSearch.addEventListener('click', () => {
        elSearchInput.value = '';
        rebuildPlaylistQueueUI();
      });
    }

    // File selection procedures
    function handleFileSelection(files) {
      const audioFiles = Array.from(files).filter(file => file.type.startsWith('audio/') || file.name.endsWith('.mp3') || file.name.endsWith('.wav') || file.name.endsWith('.ogg') || file.name.endsWith('.flac') || file.name.endsWith('.m4a'));
      if (audioFiles.length === 0) return;

      const isFirstLoad = playQueue.length === 0;

      audioFiles.forEach(file => {
        const item = {
          id: Math.random().toString(36).substring(2, 9),
          name: file.name,
          size: file.size,
          url: URL.createObjectURL(file),
          file: file
        };
        playQueue.push(item);
        saveTrackStandalone(item.id, file, item.name);
      });

      if (isShuffle) generateShuffleQueue();
      rebuildPlaylistQueueUI();
      saveTracksMetadataToLocalStorage();

      if (isFirstLoad) {
        loadAndPlayTrack(0, false); // Load metadata into player but don't autoplay automatically
      }
    }

    elFile.addEventListener('change', (e) => {
      handleFileSelection(e.target.files);
    });

    // Drag and drop events
    elDropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      elDropZone.classList.add('dragover');
    });

    elDropZone.addEventListener('dragleave', () => {
      elDropZone.classList.remove('dragover');
    });

    elDropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      elDropZone.classList.remove('dragover');
      handleFileSelection(e.dataTransfer.files);
    });

    // Rebuild Playlist UI with Drag-to-Reorder capabilities and search filtering
    function rebuildPlaylistQueueUI() {
      const searchInput = document.getElementById('standalone-search-input');
      const searchQuery = searchInput ? searchInput.value.toLowerCase().trim() : '';

      const searchContainer = document.getElementById('standalone-search-container');
      if (searchContainer) {
        searchContainer.style.display = playQueue.length > 0 ? 'block' : 'none';
      }

      const clearSearchBtn = document.getElementById('btn-clear-search');
      if (clearSearchBtn) {
        clearSearchBtn.style.display = searchQuery ? 'flex' : 'none';
      }

      if (playQueue.length === 0) {
        elQueue.innerHTML = \`<div class="empty-queue">
          <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
          <span>No audio files loaded yet</span>
        </div>\`;
        elTitle.innerText = "No Audio Loaded";
        elSizeInfo.innerText = "Select audio files on the right to start";
        currentIndex = -1;
        audioNode.src = "";
        isPlaying = false;
        updatePlayUI();
        elSeekFill.style.width = '0%';
        elTimeCurrent.innerText = "0:00";
        elTimeTotal.innerText = "0:00";
        return;
      }

      const isSearching = searchQuery !== '';
      const filtered = playQueue
        .map((track, idx) => ({ track, originalIndex: idx }))
        .filter(({ track }) => track.name.toLowerCase().includes(searchQuery));

      if (isSearching && filtered.length === 0) {
        elQueue.innerHTML = \`<div class="empty-queue" style="flex-direction: column; gap: 8px; padding: 24px 0;">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: rgba(255,255,255,0.3);"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <span style="font-size: 12px; color: rgba(255,255,255,0.6);">No matching tracks found</span>
          <button id="btn-clear-search-empty" style="margin-top: 4px; padding: 4px 10px; background: rgba(34,211,238,0.1); border: 1px solid rgba(34,211,238,0.2); border-radius: 6px; color: #22d3ee; font-size: 11px; cursor: pointer;">Clear Search</button>
        </div>\`;

        const clearEmptyBtn = document.getElementById('btn-clear-search-empty');
        if (clearEmptyBtn && searchInput) {
          clearEmptyBtn.addEventListener('click', () => {
            searchInput.value = '';
            rebuildPlaylistQueueUI();
          });
        }
        return;
      }

      elQueue.innerHTML = '';
      filtered.forEach(({ track, originalIndex }) => {
        const isActive = originalIndex === currentIndex;
        const div = document.createElement('div');
        div.className = \`track-item \${!isSearching ? 'draggable' : ''} \${isActive ? 'active' : ''}\`;
        
        if (!isSearching) {
          div.draggable = true;
          // Drag and drop reordering events
          div.addEventListener('dragstart', handleDragStart);
          div.addEventListener('dragover', handleDragOver);
          div.addEventListener('dragleave', handleDragLeave);
          div.addEventListener('drop', handleDrop);
          div.addEventListener('dragend', handleDragEnd);
        }
        
        div.dataset.index = originalIndex;

        div.innerHTML = \`
          <div class="track-info-group">
            <span class="track-number">\${originalIndex + 1}</span>
            <span class="track-title-name" title="\${track.name}">\${track.name}</span>
          </div>
          <div class="track-meta-right">
            <span>Audio file</span>
            <button class="delete-track-btn" data-index="\${originalIndex}" title="Remove track">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>
            </button>
          </div>
        \`;

        // Double click to play
        div.addEventListener('dblclick', () => {
          loadAndPlayTrack(originalIndex, true);
        });

        elQueue.appendChild(div);
      });

      // Wire delete buttons
      document.querySelectorAll('.delete-track-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const removeIdx = parseInt(btn.dataset.index);
          removeTrack(removeIdx);
        });
      });
    }

    function removeTrack(index) {
      const removedTrack = playQueue[index];
      URL.revokeObjectURL(removedTrack.url);
      deleteTrackStandalone(removedTrack.id);
      playQueue.splice(index, 1);
      saveTracksMetadataToLocalStorage();

      if (currentIndex === index) {
        // Playing track was removed
        if (playQueue.length > 0) {
          const nextIdx = index >= playQueue.length ? 0 : index;
          loadAndPlayTrack(nextIdx, isPlaying);
        } else {
          rebuildPlaylistQueueUI();
        }
      } else {
        if (currentIndex > index) {
          currentIndex--; // Align current tracking index on deletion shifts
        }
        if (isShuffle) generateShuffleQueue();
        rebuildPlaylistQueueUI();
        updateActiveTrackStyles();
      }
    }

    // Drag Sorting operations
    function handleDragStart(e) {
      dragSourceElement = this;
      this.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', this.dataset.index);
    }

    function handleDragOver(e) {
      e.preventDefault();
      this.style.borderTop = '2px solid var(--accent)';
    }

    function handleDragLeave() {
      this.style.borderTop = '';
    }

    function handleDrop(e) {
      e.preventDefault();
      this.style.borderTop = '';
      const sourceIndex = parseInt(e.dataTransfer.getData('text/plain'));
      const targetIndex = parseInt(this.dataset.index);

      if (sourceIndex !== targetIndex) {
        // Re-order playQueue array
        const draggedItem = playQueue.splice(sourceIndex, 1)[0];
        playQueue.splice(targetIndex, 0, draggedItem);

        // Adjust currentIndex if necessary
        if (currentIndex === sourceIndex) {
          currentIndex = targetIndex;
        } else if (currentIndex > sourceIndex && currentIndex <= targetIndex) {
          currentIndex--;
        } else if (currentIndex < sourceIndex && currentIndex >= targetIndex) {
          currentIndex++;
        }

        if (isShuffle) generateShuffleQueue();
        rebuildPlaylistQueueUI();
        saveTracksMetadataToLocalStorage();
      }
    }

    function handleDragEnd() {
      this.classList.remove('dragging');
      document.querySelectorAll('.track-item').forEach(item => {
        item.style.borderTop = '';
      });
    }

    // Button integrations
    elPlayBtn.addEventListener('click', playPause);
    elPrevBtn.addEventListener('click', skipPrev);
    elNextBtn.addEventListener('click', skipNext);
    elShuffleBtn.addEventListener('click', toggleShuffle);
    elRepeatBtn.addEventListener('click', toggleRepeat);
    elClear.addEventListener('click', () => {
      playQueue.forEach(item => URL.revokeObjectURL(item.url));
      clearTracksStandalone();
      playQueue = [];
      currentIndex = -1;
      localStorage.removeItem('soundflow_current_time');
      localStorage.removeItem('soundflow_current_index');
      saveTracksMetadataToLocalStorage();
      rebuildPlaylistQueueUI();
    });

    async function loadSavedQueue() {
      try {
        const metadataStr = localStorage.getItem('soundflow_tracks_metadata');
        if (!metadataStr) return;
        const metadataList = JSON.parse(metadataStr);
        if (!Array.isArray(metadataList) || metadataList.length === 0) return;

        for (const meta of metadataList) {
          const blob = await getTrackStandalone(meta.id);
          if (blob) {
            const reconstructedFile = new File([blob], meta.name, { type: meta.type || 'audio/mp3' });
            playQueue.push({
              id: meta.id,
              name: meta.name,
              size: meta.size,
              type: meta.type,
              url: URL.createObjectURL(reconstructedFile),
              file: reconstructedFile,
              duration: meta.duration || 0
            });
          }
        }

        if (playQueue.length > 0) {
          rebuildPlaylistQueueUI();
          if (currentIndex >= 0 && currentIndex < playQueue.length) {
            loadAndPlayTrack(currentIndex, false);
            if (savedProgress > 0) {
              const onMetadata = () => {
                audioNode.currentTime = savedProgress;
                elTimeCurrent.innerText = formatTime(savedProgress);
                audioNode.removeEventListener('loadedmetadata', onMetadata);
              };
              audioNode.addEventListener('loadedmetadata', onMetadata);
            }
          }
        }
      } catch (err) {
        console.error('Failed to load saved offline queue:', err);
      }
    }

    // Restore UI styles on startup
    if (isShuffle) {
      elShuffleBtn.classList.add('active');
    }
    if (loopMode !== 'none') {
      elRepeatBtn.classList.add('active');
      if (loopMode === 'all') {
        elRepeatBtn.title = 'Repeat (All)';
      } else {
        elRepeatBtn.title = 'Repeat (One)';
        elRepeatBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/><path d="M11 10h1v4"/><path d="M10 14h3"/></svg>';
      }
    }
    updateVolumeUI();
    loadSavedQueue();

    // Global keyboard listeners for playback control
    document.addEventListener('keydown', (e) => {
      const activeEl = document.activeElement;
      if (activeEl) {
        const tagName = activeEl.tagName.toLowerCase();
        const contentEditable = activeEl.getAttribute('contenteditable');
        if (
          tagName === 'input' ||
          tagName === 'textarea' ||
          tagName === 'select' ||
          contentEditable === 'true' ||
          contentEditable === ''
        ) {
          // Allow default key behavior when focused on input fields
          return;
        }
      }

      if (e.code === 'Space') {
        e.preventDefault();
        playPause();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        skipNext();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        skipPrev();
      }
    });

  </script>
</body>
</html>`;
};

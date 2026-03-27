export const CONTRACT_EDITOR_STYLES = `
  /* ═══════════════════════════════════════════════
     A4 DOCUMENT EDITOR — PROFESSIONAL DESIGN
     ═══════════════════════════════════════════════ */

  /* ─── Page Background ─── */
  .contract-editor-page {
    min-height: 100vh;
    background: linear-gradient(135deg, #f0f2f5 0%, #e4e8ec 50%, #dde1e7 100%);
    position: relative;
  }
  .contract-editor-page::before {
    content: '';
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background:
      radial-gradient(ellipse at 20% 50%, rgba(59,130,246,0.03) 0%, transparent 50%),
      radial-gradient(ellipse at 80% 20%, rgba(99,102,241,0.03) 0%, transparent 50%);
    pointer-events: none;
    z-index: 0;
  }

  /* ─── Toolbar ─── */
  .contract-toolbar {
    position: sticky;
    top: 0;
    z-index: 30;
    background: rgba(255,255,255,0.95);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border-bottom: 1px solid rgba(0,0,0,0.06);
    box-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.02);
  }
  .toolbar-inner {
    max-width: 1280px;
    margin: 0 auto;
    padding: 10px 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    flex-wrap: wrap;
  }
  .toolbar-left {
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 0;
  }
  .toolbar-right {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }
  .toolbar-back-btn {
    display: flex;
    align-items: center;
    gap: 4px;
    color: #6b7280;
    font-size: 13px;
    font-weight: 500;
    padding: 6px 10px;
    border-radius: 6px;
    border: none;
    background: transparent;
    cursor: pointer;
    transition: all 0.15s ease;
    white-space: nowrap;
  }
  .toolbar-back-btn:hover {
    color: #1f2937;
    background: #f3f4f6;
  }
  .toolbar-divider {
    width: 1px;
    height: 24px;
    background: #e5e7eb;
    flex-shrink: 0;
  }
  .toolbar-title-group {
    min-width: 0;
  }
  .toolbar-title {
    font-size: 14px;
    font-weight: 700;
    color: #111827;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 300px;
    letter-spacing: -0.01em;
  }
  .toolbar-subtitle {
    font-size: 11px;
    color: #9ca3af;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 300px;
    margin-top: 1px;
  }

  /* ─── Mode Toggle ─── */
  .mode-toggle {
    display: flex;
    background: #f3f4f6;
    border-radius: 8px;
    padding: 3px;
    gap: 2px;
  }
  .mode-toggle-btn {
    padding: 6px 14px;
    font-size: 12px;
    font-weight: 600;
    border-radius: 6px;
    border: none;
    cursor: pointer;
    transition: all 0.2s ease;
    color: #6b7280;
    background: transparent;
    white-space: nowrap;
    letter-spacing: -0.01em;
  }
  .mode-toggle-btn:hover:not(.active) {
    color: #374151;
    background: rgba(255,255,255,0.5);
  }
  .mode-toggle-btn.active {
    background: white;
    color: #2563eb;
    box-shadow: 0 1px 3px rgba(0,0,0,0.08);
  }

  /* ─── Progress Bar ─── */
  .progress-container {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 4px 12px;
    background: #f9fafb;
    border-radius: 8px;
    border: 1px solid #f3f4f6;
  }
  .progress-bar-track {
    width: 64px;
    height: 4px;
    background: #e5e7eb;
    border-radius: 999px;
    overflow: hidden;
  }
  .progress-bar-fill {
    height: 100%;
    border-radius: 999px;
    transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1), background 0.3s ease;
  }
  .progress-label {
    font-size: 11px;
    font-weight: 600;
    color: #6b7280;
    white-space: nowrap;
  }

  /* ─── Action Buttons ─── */
  .action-btn {
    padding: 6px 14px;
    font-size: 12px;
    font-weight: 600;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.15s ease;
    border: 1px solid #d1d5db;
    background: white;
    color: #374151;
    white-space: nowrap;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    letter-spacing: -0.01em;
  }
  .action-btn:hover { background: #f9fafb; border-color: #9ca3af; }
  .action-btn:disabled { opacity: 0.45; cursor: not-allowed; }

  .action-btn-primary {
    background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
    color: white;
    border: 1px solid #1d4ed8;
    box-shadow: 0 1px 2px rgba(37,99,235,0.2);
  }
  .action-btn-primary:hover:not(:disabled) {
    background: linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%);
    box-shadow: 0 2px 6px rgba(37,99,235,0.3);
    transform: translateY(-0.5px);
  }

  /* ─── Status Badge ─── */
  .status-badge {
    padding: 3px 10px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.02em;
    flex-shrink: 0;
  }

  /* ─── Alert Messages ─── */
  .alert-bar {
    margin-top: 8px;
    padding: 8px 14px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 6px;
    animation: slideDown 0.25s ease;
  }
  @keyframes slideDown {
    from { opacity: 0; transform: translateY(-4px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .alert-success {
    background: #f0fdf4;
    border: 1px solid #bbf7d0;
    color: #166534;
  }
  .alert-error {
    background: #fef2f2;
    border: 1px solid #fecaca;
    color: #991b1b;
  }

  /* ═══════════════════════════════════════════════
     A4 PAPER
     ═══════════════════════════════════════════════ */
  .a4-paper-wrapper {
    padding: 32px 16px 64px;
    display: flex;
    justify-content: center;
    position: relative;
    z-index: 1;
  }
  .a4-paper-container {
    width: 210mm;
    min-height: 297mm;
    padding: 22mm 28mm 25mm 28mm;
    background: white;
    box-shadow:
      0 0 0 1px rgba(0,0,0,0.04),
      0 2px 4px rgba(0,0,0,0.04),
      0 8px 16px rgba(0,0,0,0.06),
      0 24px 48px rgba(0,0,0,0.06);
    border-radius: 3px;
    position: relative;
    overflow: visible;
  }
  /* Subtle corner fold effect */
  .a4-paper-container::before {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    width: 0;
    height: 0;
    border-style: solid;
    border-width: 0 20px 20px 0;
    border-color: transparent #e8eaed transparent transparent;
    opacity: 0.5;
  }

  /* ═══════════════════════════════════════════════
     CONTRACT CONTENT TYPOGRAPHY
     ═══════════════════════════════════════════════ */
  .contract-content {
    font-family: 'Times New Roman', 'Noto Serif', Georgia, serif;
    font-size: 13pt;
    line-height: 1.65;
    color: #1a1a1a;
    word-wrap: break-word;
    letter-spacing: 0.01em;
    overflow: visible;
  }

  /* Force imported template wrappers to render as long flowing A4 text (no inner scroll frame). */
  .contract-content [style*="overflow"] {
    overflow: visible !important;
    overflow-y: visible !important;
    overflow-x: visible !important;
  }
  .contract-content [style*="max-height"] {
    max-height: none !important;
  }
  .contract-content [style*="height:"][style*="vh"] {
    height: auto !important;
  }
  .contract-content h1 {
    font-size: 16pt;
    font-weight: 700;
    text-align: center;
    text-transform: uppercase;
    margin: 10px 0 6px;
    letter-spacing: 0.03em;
    color: #111;
  }
  .contract-content h2 {
    font-size: 14pt;
    font-weight: 700;
    text-align: center;
    margin: 8px 0 5px;
    color: #111;
  }
  .contract-content h3 {
    font-size: 13pt;
    font-weight: 700;
    margin: 6px 0 4px;
    color: #111;
  }
  .contract-content p {
    margin: 3px 0;
    text-align: justify;
    text-justify: inter-word;
  }
  .contract-content ul, .contract-content ol {
    padding-left: 24px;
    margin: 4px 0;
  }
  .contract-content li {
    margin: 2px 0;
  }
  .contract-content strong, .contract-content b {
    font-weight: 700;
    color: #111;
  }
  .contract-content em, .contract-content i {
    font-style: italic;
  }
  .contract-content table {
    width: 100%;
    border-collapse: collapse;
    margin: 10px 0;
  }
  .contract-content table td,
  .contract-content table th {
    border: none;
    padding: 5px 8px;
    font-size: 12pt;
    vertical-align: top;
  }
  .contract-content table th {
    background: transparent;
    font-weight: 700;
    text-align: left;
  }
  .contract-content table tr {
    border-bottom: none;
  }

  /* ═══════════════════════════════════════════════
     INLINE INPUTS (Edit Mode)
     ═══════════════════════════════════════════════ */
  .contract-inline-input {
    border: none;
    border-bottom: 1.5px dashed #94a3b8;
    background: transparent;
    outline: none;
    font-family: inherit;
    font-size: inherit;
    line-height: inherit;
    color: #1e40af;
    padding: 1px 6px;
    margin: 0 2px;
    min-width: 70px;
    max-width: 380px;
    border-radius: 0;
    transition: all 0.2s ease;
    vertical-align: baseline;
    -webkit-appearance: none;
    -moz-appearance: none;
    appearance: none;
  }
  .contract-inline-input:hover:not([readonly]):not(:focus) {
    border-bottom-color: #60a5fa;
    background: rgba(59,130,246,0.03);
  }
  .contract-inline-input:focus {
    border-bottom: 2px solid #2563eb;
    background: rgba(37,99,235,0.05);
    border-bottom-style: solid;
    color: #1e3a8a;
    padding-bottom: 0;
  }
  .contract-inline-input::placeholder {
    color: #a0aec0;
    font-style: italic;
    font-size: 0.88em;
  }
  .contract-inline-input.has-value {
    color: #1a1a1a;
    border-bottom-color: #cbd5e1;
    border-bottom-style: dotted;
    font-weight: 500;
  }
  .contract-inline-input.has-value:hover:not([readonly]),
  .contract-inline-input.has-value:focus {
    border-bottom-color: #3b82f6;
    border-bottom-style: solid;
    color: #1e3a8a;
  }

  /* Readonly inputs */
  .contract-inline-input.contract-readonly {
    border-bottom: 1px dotted #d1d5db;
    color: #4b5563;
    cursor: default;
    background: rgba(0,0,0,0.01);
    font-weight: 500;
  }
  .contract-inline-input.contract-readonly:hover {
    background: rgba(0,0,0,0.02);
  }

  /* ─── Input Sizing by Type ─── */
  .contract-inline-input[type="date"] {
    min-width: 145px;
    max-width: 165px;
    font-size: 12pt;
  }
  .contract-inline-input[type="number"] {
    min-width: 80px;
    max-width: 200px;
  }
  .contract-inline-input.field-short {
    min-width: 60px;
    max-width: 160px;
  }
  .contract-inline-input.field-long {
    min-width: 220px;
    max-width: 420px;
  }

  /* ═══════════════════════════════════════════════
     PREVIEW MODE FIELD VALUES
     ═══════════════════════════════════════════════ */
  .contract-field-value {
    font-weight: 600;
    color: #111;
  }
  .contract-field-empty {
    color: #9ca3af;
    font-style: italic;
    border-bottom: 1px dashed #d1d5db;
    padding: 0 4px;
    font-size: 0.92em;
  }

  /* ═══════════════════════════════════════════════
     RESPONSIVE
     ═══════════════════════════════════════════════ */
  @media (max-width: 1000px) {
    .a4-paper-container {
      width: 100%;
      min-height: auto;
      padding: 14mm 12mm;
      border-radius: 0;
    }
    .a4-paper-wrapper {
      padding: 16px 0;
    }
    .toolbar-inner {
      padding: 8px 12px;
    }
    .toolbar-title { max-width: 160px; }
    .contract-content { font-size: 11pt; }
  }

  /* ═══════════════════════════════════════════════
     PRINT STYLES
     ═══════════════════════════════════════════════ */
  @media print {
    .contract-toolbar { display: none !important; }
    .contract-editor-page { background: white !important; }
    .contract-editor-page::before { display: none !important; }
    .a4-paper-container {
      box-shadow: none !important;
      margin: 0 !important;
      padding: 0 !important;
      width: 100% !important;
    }
    .a4-paper-container::before { display: none !important; }
    .a4-paper-wrapper { padding: 0 !important; }
    .contract-inline-input {
      border-bottom: none !important;
      color: #000 !important;
    }
  }
`;

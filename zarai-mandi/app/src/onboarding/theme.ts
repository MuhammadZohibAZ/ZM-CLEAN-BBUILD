// Styles for the onboarding flow (injected once by OnboardingFlow).

// ─── Theme CSS (matches CustomerFaceApp colors/fonts) ─────────────────────────
export const ZM_OB_THEME = `
  :root {
    --zm-green: #087F63;
    --zm-deep: #064D40;
    --zm-bright: #2FAE68;
    --zm-dark: #183B34;
    --zm-text: #183B34;
    --zm-muted: #52635F;
    --zm-border: #D5E2DD;
    --zm-light: #E4F2EC;
    --zm-bg: #F1F7F4;
    --zm-surface: #F4FAF7;
    --zm-card: #FFFFFF;
    --zm-gold: #B9822E;
    --zm-gold-lt: #FFF8E1;
  }
  * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
  .phone-shell {
    width: 100%;
    height: 100dvh;
    max-width: 448px;
    margin: 0 auto;
    background: var(--zm-bg);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    position: relative;
    font-family: 'Inter', 'Poppins', sans-serif;
    box-shadow: 0 0 80px rgba(0,0,0,0.18);
  }
  .screen-scroll {
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    scrollbar-width: none;
  }
  .screen-scroll::-webkit-scrollbar { display: none; }
  .auth-card {
    background: #fff;
    border-radius: 24px;
    padding: 24px 20px 20px;
    box-shadow: 0 4px 24px rgba(6,77,64,0.1);
    border: 1px solid var(--zm-border);
    width: 100%;
    max-width: 400px;
    margin: 0 auto;
  }
  .eyebrow {
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #087F63;
    margin-bottom: 4px;
    font-family: 'Inter', sans-serif;
  }
  .headline {
    font-family: 'Poppins', 'Inter', sans-serif;
    font-size: 22px;
    font-weight: 800;
    color: #183B34;
    margin-bottom: 4px;
    line-height: 1.2;
  }
  .subline {
    font-size: 13.5px;
    color: #52635F;
    margin-bottom: 18px;
    line-height: 1.5;
  }
  .progress-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--zm-border);
    transition: background 0.2s, transform 0.2s;
  }
  .progress-dot.active {
    background: #087F63;
    transform: scale(1.3);
  }
  .btn-primary {
    width: 100%;
    padding: 15px;
    border-radius: 14px;
    background: linear-gradient(135deg, #087F63, #064D40);
    color: #fff;
    font-size: 15px;
    font-weight: 700;
    border: none;
    cursor: pointer;
    margin-top: 8px;
    transition: opacity 0.15s;
    font-family: 'Inter', sans-serif;
  }
  .btn-primary:disabled { opacity: 0.45; cursor: not-allowed; }
  .google-signup-btn {
    width: 100%;
    padding: 13px 14px;
    border-radius: 14px;
    background: #fff;
    color: var(--zm-text);
    font-size: 14px;
    font-weight: 600;
    border: 1.5px solid var(--zm-border);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    font-family: 'Inter', sans-serif;
    transition: border-color 0.15s, background 0.15s, box-shadow 0.15s;
  }
  .google-signup-btn:hover {
    border-color: #C8D7D2;
    background: #FAFCFB;
    box-shadow: 0 2px 8px rgba(6,77,64,0.06);
  }
  .google-signup-btn:active {
    transform: translateY(1px);
  }
  .btn-secondary {
    width: 100%;
    padding: 14px;
    border-radius: 14px;
    background: var(--zm-light);
    color: #087F63;
    font-size: 14px;
    font-weight: 700;
    border: 1.5px solid #087F63;
    cursor: pointer;
    margin-top: 8px;
    font-family: 'Inter', sans-serif;
  }
  .btn-ghost {
    background: none;
    border: none;
    color: var(--zm-muted);
    cursor: pointer;
    font-size: 14px;
    font-family: 'Inter', sans-serif;
  }
  .lang-btn {
    padding: 14px 12px;
    border-radius: 14px;
    background: #fff;
    border: 1.5px solid var(--zm-border);
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    color: var(--zm-text);
    transition: border-color 0.15s, background 0.15s;
    font-family: 'Inter', sans-serif;
  }
  .lang-btn.regional { font-family: 'Noto Nastaliq Urdu', serif; font-size: 16px; }
  .lang-btn:hover { border-color: #087F63; background: var(--zm-light); }
  .radio-group-container { display: flex; flex-direction: column; gap: 10px; margin-bottom: 16px; }
  .radio-label { display: flex; align-items: center; gap: 12px; padding: 13px 16px; border-radius: 14px; border: 1.5px solid var(--zm-border); background: #fff; cursor: pointer; transition: border-color 0.15s; }
  .radio-label:has(.radio-input:checked) { border-color: #087F63; background: var(--zm-light); }
  .radio-input { display: none; }
  .radio-custom { width: 18px; height: 18px; border-radius: 50%; border: 2px solid var(--zm-border); flex-shrink: 0; position: relative; transition: border-color 0.15s; }
  .radio-label:has(.radio-input:checked) .radio-custom { border-color: #087F63; }
  .radio-label:has(.radio-input:checked) .radio-custom::after { content: ''; position: absolute; top: 3px; left: 3px; width: 8px; height: 8px; border-radius: 50%; background: #087F63; }
  .radio-text { font-size: 14px; font-weight: 600; color: var(--zm-text); }
  .field { margin-bottom: 14px; }
  .fl-input { width: 100%; padding: 16px 14px 6px; border: none; border-bottom: 2px solid var(--zm-border); background: transparent; font-size: 14px; color: var(--zm-text); outline: none; font-family: 'Inter', sans-serif; transition: border-color 0.15s; }
  .fl-input:focus { border-bottom-color: #087F63; }
  .fl-label { position: absolute; top: 14px; left: 14px; font-size: 13px; color: var(--zm-muted); pointer-events: none; transition: 0.15s; }
  .fl-input.filled ~ .fl-label, .fl-input:focus ~ .fl-label { top: 5px; font-size: 16px; color: #000000; }
  .fl-underline { height: 2px; background: #087F63; transform: scaleX(0); transition: transform 0.2s; }
  .fl-input:focus ~ .fl-underline { transform: scaleX(1); }
  .field-row { display: flex; gap: 10px; align-items: flex-end; }
  .cc-wrap { width: 80px; flex-shrink: 0; }
  .cc-select { width: 100%; padding: 10px 8px; border: 1.5px solid var(--zm-border); border-radius: 10px; background: #fff; font-size: 13px; font-weight: 600; color: var(--zm-text); cursor: pointer; }
  .input-wrap { flex: 1; position: relative; }
  .input-wrap input { width: 100%; padding: 14px 12px 6px; border: none; border-bottom: 2px solid var(--zm-border); background: transparent; font-size: 14px; color: var(--zm-text); outline: none; font-family: 'Inter', sans-serif; }
  .input-wrap label { position: absolute; top: 12px; left: 12px; font-size: 13px; color: var(--zm-muted); pointer-events: none; transition: 0.15s; }
  .input-wrap input.filled ~ label, .input-wrap input:focus ~ label { top: 2px; font-size: 10px; color: #087F63; }
  .input-underline { height: 2px; background: #087F63; transform: scaleX(0); transition: transform 0.2s; }
  .input-wrap input:focus ~ .input-underline { transform: scaleX(1); }
  .wa-panel { border-radius: 14px; border: 1.5px solid var(--zm-border); overflow: hidden; }
  .wa-panel-header { display: flex; align-items: center; gap: 12px; padding: 12px 14px; cursor: pointer; background: #fff; }
  .wa-panel-body { max-height: 0; overflow: hidden; transition: max-height 0.3s ease; }
  .wa-panel-body.open { max-height: 400px; }
  .wa-panel-inner { padding: 0 14px 14px; }
  .toggle-track { width: 40px; height: 22px; border-radius: 11px; background: var(--zm-border); cursor: pointer; position: relative; transition: background 0.2s; }
  .toggle-track.on { background: #087F63; }
  .toggle-thumb { position: absolute; top: 3px; left: 3px; width: 16px; height: 16px; border-radius: 50%; background: #fff; transition: transform 0.2s; box-shadow: 0 1px 4px rgba(0,0,0,0.15); }
  .toggle-track.on .toggle-thumb { transform: translateX(18px); }
  .occ-scroll-box { overflow-y: auto; border-radius: 12px; border: 1.5px solid var(--zm-border); scrollbar-width: thin; }
  .occ-option { display: flex; align-items: center; gap: 10px; padding: 11px 14px; cursor: pointer; border-bottom: 1px solid var(--zm-border); font-size: 13.5px; color: var(--zm-text); background: #fff; transition: background 0.12s; }
  .occ-option:last-child { border-bottom: none; }
  .occ-option.selected { background: var(--zm-light); }
  .occ-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--zm-border); flex-shrink: 0; }
  .occ-option.selected .occ-dot { background: #087F63; }
  .role-sub-label { font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: var(--zm-muted); margin-bottom: 8px; }
  .dur-tab { flex: 1; padding: 8px 4px; border: none; border-radius: 9px; background: transparent; font-size: 12px; font-weight: 700; cursor: pointer; color: var(--zm-muted); transition: background 0.15s, color 0.15s; font-family: 'Inter', sans-serif; }
  .dur-tab.active { background: #fff; color: #087F63; box-shadow: 0 2px 8px rgba(6,77,64,0.1); }
  .price-row { display: flex; justify-content: space-between; font-size: 13px; color: var(--zm-muted); }
  .pay-method { display: flex; align-items: center; gap: 14px; padding: 13px 16px; border-radius: 14px; border: 1.5px solid var(--zm-border); background: #fff; cursor: pointer; margin-bottom: 10px; transition: border-color 0.15s, background 0.15s; }
  .pay-method.selected { border-color: #087F63; background: var(--zm-light); }
  .pay-method-icon { width: 44px; height: 44px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .pay-detail-box { background: var(--zm-surface); border-radius: 14px; border: 1px solid var(--zm-border); padding: 14px 16px; margin-bottom: 14px; }
  .pay-detail-row { display: flex; justify-content: space-between; font-size: 13px; color: var(--zm-muted); padding: 6px 0; border-bottom: 1px solid rgba(6,77,64,0.07); }
  .pay-detail-row:last-child { border-bottom: none; font-weight: 700; color: var(--zm-dark); }
  .upload-area { border: 2px dashed var(--zm-border); border-radius: 14px; padding: 22px; text-align: center; cursor: pointer; margin-bottom: 14px; transition: border-color 0.15s; }
  .upload-area.has-file { border-color: #087F63; background: var(--zm-light); }
  .item-check { position: absolute; width: 18px; height: 18px; border-radius: 50%; background: #087F63; color: #fff; font-size: 10px; font-weight: 800; display: flex; align-items: center; justify-content: center; }
  .sel-tag { background: var(--zm-light); border-radius: 20px; padding: 4px 10px; font-size: 12px; font-weight: 600; color: #087F63; border: 1px solid rgba(8,127,99,0.2); }
  .sel-tag button { background: none; border: none; cursor: pointer; font-size: 14px; color: var(--zm-muted); padding: 0 0 0 2px; }
  .logo-anim { animation: logoFade 0.6s ease; }
  .s-enter { animation: screenEnter 0.3s ease; }
  .thin-scroll::-webkit-scrollbar { width: 4px; }
  .thin-scroll::-webkit-scrollbar-track { background: transparent; }
  .thin-scroll::-webkit-scrollbar-thumb { background: var(--zm-border); border-radius: 4px; }
  @keyframes logoFade { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes screenEnter { from { opacity: 0; transform: translateX(12px); } to { opacity: 1; transform: translateX(0); } }
  @keyframes loadBar { from { width: 0%; } to { width: 100%; } }
  .btn-txt { font-weight: 700; }
  .profile-input { width: 100%; padding: 13px 14px; border: 1.5px solid var(--zm-border); border-radius: 12px; background: #fff; color: var(--zm-text); font: 14px 'Inter', sans-serif; text-align: left; outline: none; box-sizing: border-box; }
  .profile-input:focus { outline: 2px solid rgba(8,127,99,0.16); border-color: #087F63; }
  .profile-input::placeholder { color: var(--zm-muted); }
  .profile-select { width: 100%; display: flex; justify-content: space-between; align-items: center; padding: 13px 14px; border: 1.5px solid var(--zm-border); border-radius: 12px; background: #fff; color: var(--zm-text); font: 14px 'Inter', sans-serif; cursor: pointer; text-align: left; }
  .profile-select:focus { outline: 2px solid rgba(8,127,99,0.16); border-color: #087F63; }
  .dropdown-panel { margin-top: 6px; border: 1.5px solid var(--zm-border); border-radius: 12px; background: #fff; overflow: hidden; box-shadow: 0 8px 22px rgba(6,77,64,0.10); }
  .dropdown-search { width: 100%; border: none; border-bottom: 1px solid var(--zm-border); padding: 12px 14px; font: 13px 'Inter', sans-serif; outline: none; color: var(--zm-text); }
  .dropdown-list { max-height: 190px; overflow-y: auto; }
  .dropdown-empty { padding: 15px; text-align: center; color: var(--zm-muted); font-size: 12.5px; }
  .dropdown-panel .occ-option { border-bottom: 1px solid var(--zm-border); }
  .dropdown-panel .occ-option:last-child { border-bottom: none; }
  .field-row { display: flex; gap: 10px; align-items: flex-end; }
  .field-row > div:last-child { flex: 1; }
`;

import React, { Suspense, lazy } from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import { markDevicePreview } from './lib/device-bridge'
import { loadDatasetDates } from './customer-face/shared/data/datasetDates'

// On desktop, show the app inside an iPhone 15 Pro Max mockup (the app itself runs
// in the mockup's iframe). Phones, the iframe itself, and ?device=off get the app directly.
// Each side loads only what it renders, so the mockup page doesn't load the whole app too.
const showDevicePreview =
  window.self === window.top &&
  new URLSearchParams(window.location.search).get('device') !== 'off' &&
  window.matchMedia('(min-width: 768px)').matches

markDevicePreview()

// Same as the loading screen in index.html, kept up while the app's code downloads
// (an empty fallback here showed a blank page after the first second).
function BootSplash() {
  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, background: '#F1F7F4', fontFamily: 'system-ui, -apple-system, sans-serif', color: '#0E645C' }}>
      <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.01em' }}>Zarai Mandi</div>
      <div style={{ fontSize: 18, fontWeight: 700 }} dir="rtl" lang="ur">زرعی منڈی</div>
      <div style={{ width: 28, height: 28, marginTop: 6, borderRadius: '50%', border: '3px solid #CFE3DA', borderTopColor: '#0E645C', animation: 'zm-boot-spin 0.8s linear infinite' }} />
    </div>
  )
}

const Root = lazy(() => (showDevicePreview ? import('./DevicePreview') : import('./App')))

// The app's charts and date pickers follow the data's date range, so load it first
// (the desktop mockup page only frames the app and doesn't need it).
const ready = showDevicePreview ? Promise.resolve() : loadDatasetDates()

ready.then(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <Suspense fallback={<BootSplash />}>
        <Root />
      </Suspense>
    </React.StrictMode>,
  )
})

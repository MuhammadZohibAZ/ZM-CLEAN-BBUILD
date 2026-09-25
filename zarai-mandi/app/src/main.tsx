import React, { Suspense, lazy } from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'

// On desktop, show the app inside an iPhone 15 Pro Max mockup (the app itself runs
// in the mockup's iframe). Phones, the iframe itself, and ?device=off get the app directly.
// Each side loads only what it renders, so the mockup page doesn't load the whole app too.
const showDevicePreview =
  window.self === window.top &&
  new URLSearchParams(window.location.search).get('device') !== 'off' &&
  window.matchMedia('(min-width: 768px)').matches

const Root = lazy(() => (showDevicePreview ? import('./DevicePreview') : import('./App')))

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Suspense fallback={null}>
      <Root />
    </Suspense>
  </React.StrictMode>,
)

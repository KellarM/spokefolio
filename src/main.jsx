import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import { APP_BUILD_TAG } from '@/lib/app-params'
import '@/index.css'

// Browsers surface "ResizeObserver loop completed with undelivered
// notifications" as a window error whenever a measured element changes size
// while it is being measured (any layout that reflows itself on resize does
// this - the greeting fitter, a popover settling, a scroll area). It is a
// notice that the loop was resolved on the next frame, not a failure, so it is
// kept out of the error log instead of alarming the person using the studio.
// The build tag prints once per load: identify the deployed build instantly.
console.info('[spokefolio] build:', APP_BUILD_TAG);

const BENIGN_RESIZE_NOTICE = /ResizeObserver loop (limit exceeded|completed with undelivered notifications)/i
window.addEventListener('error', (event) => {
  if (BENIGN_RESIZE_NOTICE.test(event.message || '')) {
    event.stopImmediatePropagation()
    event.preventDefault()
  }
}, true)

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)
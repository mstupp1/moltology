import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import { RootLayout } from './app/routes/__root'
import { DashboardRoute } from './app/routes/index'
import { MarketRoute } from './app/routes/market'
import { PipelineRoute } from './app/routes/pipeline'
import { LandingRoute } from './app/routes/landing'

const App: React.FC = () => {
  const [currentPath, setCurrentPath] = useState(window.location.pathname || '/')
  const [isMarketGated, setIsMarketGated] = useState(true)

  useEffect(() => {
    const onPopState = () => setCurrentPath(window.location.pathname)
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  const handleNavigate = (path: string) => {
    window.history.pushState({}, '', path)
    setCurrentPath(path)
  }

  const handleClearGate = () => {
    setIsMarketGated(false)
  }

  // Standalone routes outside of the Market/HUD layout
  if (currentPath === '/' || currentPath === '/landing') {
    return (
      <LandingRoute
        onNavigate={handleNavigate}
        isMarketGated={isMarketGated}
        onClearGate={handleClearGate}
      />
    )
  }

  // Inside-HUD system routes
  const renderRoute = () => {
    switch (currentPath) {
      case '/market':
        return (
          <MarketRoute
            isMarketGated={isMarketGated}
            onClearGate={handleClearGate}
          />
        )
      case '/pipeline':
        return <PipelineRoute />
      case '/dashboard':
      default:
        return <DashboardRoute onNavigate={handleNavigate} />
    }
  }

  return (
    <RootLayout currentRoute={currentPath} onNavigate={handleNavigate} isMarketGated={isMarketGated}>
      {renderRoute()}
    </RootLayout>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

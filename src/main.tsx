import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import { NeonAuthUIProvider } from '@neondatabase/neon-js/auth/react'
import '@neondatabase/neon-js/ui/css'
import './index.css'
import { authClient } from './lib/auth'
import { RootLayout } from './app/routes/__root'
import { DashboardRoute } from './app/routes/index'
import { MarketRoute } from './app/routes/market'
import { PipelineRoute } from './app/routes/pipeline'
import { LandingRoute } from './app/routes/landing'
import { IsolationRoute } from './app/routes/isolation'
import { ChassisRoute } from './app/routes/chassis'
import { CommunityRoute } from './app/routes/community'
import { AuthRoute } from './app/routes/auth'

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

  const isAuthPath = 
    currentPath === '/sign-up' || 
    currentPath === '/sign-in' || 
    currentPath === '/login' || 
    currentPath === '/signup' || 
    currentPath.startsWith('/auth')

  if (isAuthPath) {
    return <AuthRoute onNavigate={handleNavigate} />
  }

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
      case '/isolation':
        return <IsolationRoute />
      case '/chassis':
        return <ChassisRoute />
      case '/community':
        return <CommunityRoute />
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
    <NeonAuthUIProvider emailOTP authClient={authClient}>
      <App />
    </NeonAuthUIProvider>
  </React.StrictMode>
)

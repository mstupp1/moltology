import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import { RootLayout } from './app/routes/__root'
import { DashboardRoute } from './app/routes/index'
import { MarketRoute } from './app/routes/market'
import { PipelineRoute } from './app/routes/pipeline'

const App: React.FC = () => {
  const [currentPath, setCurrentPath] = useState(window.location.pathname || '/')

  useEffect(() => {
    const onPopState = () => setCurrentPath(window.location.pathname)
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  const handleNavigate = (path: string) => {
    window.history.pushState({}, '', path)
    setCurrentPath(path)
  }

  const renderRoute = () => {
    switch (currentPath) {
      case '/market':
        return <MarketRoute />
      case '/pipeline':
        return <PipelineRoute />
      default:
        return <DashboardRoute onNavigate={handleNavigate} />
    }
  }

  return (
    <RootLayout currentRoute={currentPath} onNavigate={handleNavigate}>
      {renderRoute()}
    </RootLayout>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

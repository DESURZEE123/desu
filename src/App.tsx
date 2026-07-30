import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { DesktopPortfolio } from './components/Desktop/DesktopPortfolio'
import { MobilePortfolio } from './components/Mobile/MobilePortfolio'
import { AlbumPage } from './pages/AlbumPage'
import { PrototypePage } from './pages/PrototypePage'
import { useMediaQuery } from './hooks/useMediaQuery'

function HomePage() {
  const isDesktop = useMediaQuery('(min-width: 768px)')
  return isDesktop ? <DesktopPortfolio /> : <MobilePortfolio />
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/album" element={<AlbumPage />} />
        <Route path="/prototype" element={<PrototypePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App

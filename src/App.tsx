import { DesktopPortfolio } from './components/Desktop/DesktopPortfolio'
import { MobilePortfolio } from './components/Mobile/MobilePortfolio'
import { useMediaQuery } from './hooks/useMediaQuery'

function App() {
  const isDesktop = useMediaQuery('(min-width: 768px)')

  return isDesktop ? <DesktopPortfolio /> : <MobilePortfolio />
}

export default App

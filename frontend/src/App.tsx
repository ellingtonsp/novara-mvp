import { AuthProvider } from './contexts/AuthContext'
import NovaraLanding from './components/NovaraLanding'
import './App.css'

function App() {
  return (
    <AuthProvider>
      <NovaraLanding />
    </AuthProvider>
  )
}

export default App
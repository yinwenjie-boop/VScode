import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import Writing from './pages/Writing'
import Result from './pages/Result'
import History from './pages/History'
import Settings from './pages/Settings'
import Reading from './pages/Reading'
import Cloze from './pages/Cloze'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/writing" element={<Writing />} />
        <Route path="/writing/:topicId" element={<Writing />} />
        <Route path="/result/:essayId" element={<Result />} />
        <Route path="/history" element={<History />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/reading" element={<Reading />} />
        <Route path="/cloze" element={<Cloze />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

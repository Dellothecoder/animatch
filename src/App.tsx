import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Results from './pages/Results';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-[#0a0a0f]">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/recs" element={<Results />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

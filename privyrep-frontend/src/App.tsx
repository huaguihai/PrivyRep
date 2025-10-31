import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Landing } from './pages/Landing';
import { DApp } from './pages/DApp';
import './App.css';

// Load FHE diagnostic tools in development mode
if (import.meta.env.DEV) {
  import('./utils/fheDebug').then(() => {
    console.log('FHE diagnostic tools loaded! Run diagnoseFhe() in console to diagnose issues');
  });
}

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/app" element={<DApp />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

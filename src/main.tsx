import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from "react-router-dom";
import './index.css'
import Dashboard from './Pages/Dashboard.tsx'
import Landing from './Pages/Landing.tsx'
import AboutUs from './Pages/AboutUs.tsx'
import { Auth } from './Pages/Auth.tsx';
import { NotFound } from './Pages/NotFound.tsx';

createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/about" element={<AboutUs />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  </BrowserRouter>
)

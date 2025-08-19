import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Home } from './pages/Home';
import { Presenter } from './pages/Presenter';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/presenter" element={<Presenter />} />
      </Routes>
    </Router>
  );
}

export default App;



import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { MainMenu } from './pages/MainMenu';
import { Directorio } from './pages/Directorio';
import { Presenter } from './pages/Presenter';
import { MeetingView } from './pages/MeetingView';
import { Control } from './pages/Control';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainMenu />} />
        <Route path="/directorio" element={<Directorio />} />
        <Route path="/predirectorio" element={<div className="min-h-screen bg-gray-100 flex items-center justify-center"><div className="text-center"><h1 className="text-2xl font-bold text-gray-800 mb-4">Predirectorio</h1><p className="text-gray-600">Funcionalidad en desarrollo</p></div></div>} />
        <Route path="/coaching" element={<div className="min-h-screen bg-gray-100 flex items-center justify-center"><div className="text-center"><h1 className="text-2xl font-bold text-gray-800 mb-4">Jornada de Coaching Empresarial</h1><p className="text-gray-600">Funcionalidad en desarrollo</p></div></div>} />
        <Route path="/presenter" element={<Presenter />} />
        <Route path="/meeting" element={<MeetingView />} />
        <Route path="/control" element={<Control />} />
      </Routes>
    </Router>
  );
}

export default App;



import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Home } from './pages/Home';
import { Presenter } from './pages/Presenter';
import { MeetingView } from './pages/MeetingView';
import { Control } from './pages/Control';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/presenter" element={<Presenter />} />
        <Route path="/meeting" element={<MeetingView stages={[]} />} />
        <Route path="/control" element={<Control />} />
      </Routes>
    </Router>
  );
}

export default App;



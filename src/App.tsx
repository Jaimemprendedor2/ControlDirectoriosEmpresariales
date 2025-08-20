import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Home } from './pages/Home';
import { Presenter } from './pages/Presenter';
import { MeetingView } from './pages/MeetingView';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/presenter" element={<Presenter />} />
        <Route path="/meeting" element={<MeetingView stages={[]} />} />
      </Routes>
    </Router>
  );
}

export default App;



import {BrowserRouter, Routes, Route} from 'react-router-dom';
   import Main from "./components/Main.jsx";
import RedirectHandler from "./components/RedirectHandler.jsx";

export default function App() {

  return (
  <BrowserRouter>
  <Routes>
      <Route path="/:code" element={<RedirectHandler />} />
    
    <Route path="/" element={<Main />} />
    </Routes>
    </BrowserRouter>
  );
}









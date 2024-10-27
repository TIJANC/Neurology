import 'bootstrap/dist/css/bootstrap.min.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Welcome from './assets/Welcome';
import Signup from './assets/Signup';
import Login from './assets/Login';
import Home from './assets/Home';
import PrivateRoute from './assets/PrivateRoute'; 
import AdminDashboard from './assets/AdminDashboard';
import ClientList from './assets/Admin Pages/ClientList';
import UserInformation from './assets/Admin Pages/UserInformation';
//Tests
import DigitStroop from './assets/Tests/DigitStroop'
import Go_NoGo from './assets/Tests/Go-NoGo'
import SimonEffect from './assets/Tests/SimonEffect';
import FlankerTask from './assets/Tests/FlankerTask';
import DualTask from './assets/Tests/DualTask';
//Ricerca
import Ricerca from './assets/Ricerca/Voice'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/register" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/home" element={<Home />} />

        <Route path="/digit-stroop" element={<DigitStroop/>} />
        <Route path="/Go-NoGo" element={<Go_NoGo/>} />
        <Route path="/SimonEffect" element={<SimonEffect />} />
        <Route path="/FlankerTask" element={<FlankerTask />} />
        <Route path="/DualTask" element={<DualTask />} />
        <Route path="/Ricerca" element={<Ricerca />} />
        
        {/* Protected routes */}
        <Route path="/admin-dashboard" element={<PrivateRoute element={<AdminDashboard />} />} />
        <Route path="/ClientList" element={<PrivateRoute element={<ClientList />} />} />
        <Route path="//user-information/:userName" element={<PrivateRoute element={<UserInformation />} />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

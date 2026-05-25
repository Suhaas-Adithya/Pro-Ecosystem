import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Landing from './components/Landing';
import Room from './components/Room';
import Login from './components/Login';

// Wrapper component to protect routes
function PrivateRoute({ children }) {
  const { currentUser } = useAuth();
  return currentUser ? children : <Navigate to="/login" replace />;
}

import { AppearanceProvider } from './contexts/AppearanceContext';

function App() {
  return (
    <AppearanceProvider>
      <AuthProvider>
        <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route 
            path="/" 
            element={
              <PrivateRoute>
                <Landing />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/room/:roomId" 
            element={
              <PrivateRoute>
                <Room />
              </PrivateRoute>
            } 
          />
        </Routes>
      </BrowserRouter>
      </AuthProvider>
    </AppearanceProvider>
  );
}

export default App;

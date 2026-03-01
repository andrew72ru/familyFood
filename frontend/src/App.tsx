import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  NavLink,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import { Container, Nav, Navbar, Button } from 'react-bootstrap';
import './App.css';
import DishList from './components/DishList';
import IngredientManager from './components/IngredientManager';
import TagManager from './components/TagManager';
import DishDetail from './components/DishDetail';
import DishCreate from './components/DishCreate';
import AdminDishList from './components/AdminDishList';
import LoginForm from './components/LoginForm';
import { AuthProvider, useAuth } from './context/AuthContext';

const Navigation = () => {
  const { isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (location.pathname === '/login') {
    return null;
  }

  return (
    <Navbar bg="dark" variant="dark" expand="lg" className="mb-4 shadow-sm" sticky="top">
      <Container>
        <Navbar.Brand as={Link} to="/" className="d-flex align-items-center">
          <img
            alt="Family Food Logo"
            src="/icon.svg"
            width="30"
            height="30"
            className="d-inline-block align-top me-2"
          />
          Family Food
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={NavLink} to="/dishes">
              Dishes
            </Nav.Link>
            <Nav.Link as={NavLink} to="/ingredients">
              Ingredients
            </Nav.Link>
            <Nav.Link as={NavLink} to="/tags">
              Tags
            </Nav.Link>
          </Nav>
          <Nav>
            {isAuthenticated ? (
              <Button variant="outline-light" onClick={handleLogout}>
                Logout
              </Button>
            ) : (
              <Nav.Link as={Link} to="/login">
                Login
              </Nav.Link>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Navigation />

          <Container>
            <Routes>
              <Route path="/" element={<DishList />} />
              <Route path="/dishes" element={<DishList />} />
              <Route path="/dishes/new" element={<DishCreate />} />
              <Route path="/dishes/:id" element={<DishDetail />} />
              <Route path="/ingredients" element={<IngredientManager />} />
              <Route path="/tags" element={<TagManager />} />
              <Route path="/admin/dishes" element={<AdminDishList />} />
              <Route path="/login" element={<LoginForm />} />
            </Routes>
          </Container>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;

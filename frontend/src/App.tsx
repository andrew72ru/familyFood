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
import { Container, Nav, Navbar } from 'react-bootstrap';
import DishList from './components/DishList';
import IngredientManager from './components/IngredientManager';
import TagManager from './components/TagManager';
import DishDetail from './components/DishDetail';
import DishCreate from './components/DishCreate';
import AdminDishList from './components/AdminDishList';
import LoginForm from './components/LoginForm';
import { AuthProvider, useAuth } from './context/AuthContext';

const TopNavigation = () => {
  const location = useLocation();

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
            <Nav.Link as={NavLink} to="/dishes/new">
              Add New Dish
            </Nav.Link>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

const BottomNavigation = () => {
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
    <Navbar bg="dark" variant="dark" className="py-2">
      <Container>
        <Navbar.Brand as={Link} to="/" className="d-flex align-items-center">
          <img
            alt="Family Food Logo"
            src="/icon.svg"
            width="25"
            height="25"
            className="d-inline-block align-top me-2"
          />
          <small>Family Food</small>
        </Navbar.Brand>
        <Nav className="ms-auto">
          {isAuthenticated ? (
            <Nav.Link
              as="button"
              className="btn btn-outline-secondary text-light opacity-75"
              onClick={handleLogout}
            >
              Logout
            </Nav.Link>
          ) : (
            <Nav.Link as={Link} to="/login">
              Login
            </Nav.Link>
          )}
        </Nav>
      </Container>
    </Navbar>
  );
};

const rnd = (min: number, max: number): Number => {
  const minCelled = Math.ceil(min);
  const maxFloored = Math.floor(max);

  return Math.floor(Math.random() * (maxFloored - minCelled + 1) + minCelled);
};

function App() {
  const backgroundUrl = `${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/images/background-${rnd(1, 3)}.jpg`;

  React.useEffect(() => {
    document.body.style.backgroundImage = `url(${backgroundUrl})`;
    document.body.style.backgroundSize = 'cover';
    document.body.style.backgroundAttachment = 'fixed';
    document.body.style.backgroundPosition = 'center';
  }, [backgroundUrl]);

  return (
    <AuthProvider>
      <Router>
        <div className="app content-overlay">
          <TopNavigation />

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
        <BottomNavigation />
      </Router>
    </AuthProvider>
  );
}

export default App;

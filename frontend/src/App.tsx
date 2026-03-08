import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Container, Nav, Navbar, NavDropdown } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import DishList from './components/DishList';
import IngredientManager from './components/IngredientManager';
import TagManager from './components/TagManager';
import DishDetail from './components/DishDetail';
import DishCreate from './components/DishCreate';
import AdminDishList from './components/AdminDishList';
import LoginForm from './components/LoginForm';
import PullToRefresh from './components/PullToRefresh';
import { AuthProvider, useAuth } from './context/AuthContext';

const TopNavigation = () => {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const [expanded, setExpanded] = React.useState(false);

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    setExpanded(false);
  };

  React.useEffect(() => {
    window.scrollTo(0, 0);
    setExpanded(false);
  }, [location.pathname]);

  if (location.pathname === '/login') {
    return null;
  }

  return (
    <Navbar
      bg="dark"
      variant="dark"
      expand="lg"
      className="mb-4 shadow-sm"
      sticky="top"
      expanded={expanded}
      onToggle={setExpanded}
    >
      <Container>
        <Navbar.Brand as={Link} to="/" className="d-flex align-items-center" onClick={() => setExpanded(false)}>
          <img
            alt={t('common.app_name')}
            src="/icon.svg"
            width="30"
            height="30"
            className="d-inline-block align-top me-2"
          />
          {t('common.app_name')}
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={NavLink} to="/dishes">
              {t('navigation.dishes')}
            </Nav.Link>
            <Nav.Link as={NavLink} to="/ingredients">
              {t('navigation.ingredients')}
            </Nav.Link>
            <Nav.Link as={NavLink} to="/tags">
              {t('navigation.tags')}
            </Nav.Link>
          </Nav>
          <Nav>
            <Nav.Link as={NavLink} to="/dishes/new">
              {t('navigation.add_new_dish')}
            </Nav.Link>
            <NavDropdown title={i18n.language.split('-')[0].toUpperCase()} id="language-dropdown" align="end">
              <NavDropdown.Item onClick={() => changeLanguage('en')}>{t('language.en')}</NavDropdown.Item>
              <NavDropdown.Item onClick={() => changeLanguage('ru')}>{t('language.ru')}</NavDropdown.Item>
            </NavDropdown>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

const BottomNavigation = () => {
  const { t } = useTranslation();
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
            alt={t('common.app_name')}
            src="/icon.svg"
            width="25"
            height="25"
            className="d-inline-block align-top me-2"
          />
          <small>{t('common.app_name')}</small>
        </Navbar.Brand>
        <Nav className="ms-auto">
          {isAuthenticated ? (
            <Nav.Link as="button" className="btn btn-outline-secondary text-light opacity-75" onClick={handleLogout}>
              {t('common.logout')}
            </Nav.Link>
          ) : (
            <Nav.Link as={Link} to="/login">
              {t('common.login')}
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
  const backgroundUrl = `${process.env.REACT_APP_API_URL || ''}/images/background-${rnd(1, 3)}.jpg`;

  React.useEffect(() => {
    document.body.style.backgroundImage = `url(${backgroundUrl})`;
    document.body.style.backgroundSize = 'cover';
    document.body.style.backgroundAttachment = 'fixed';
    document.body.style.backgroundPosition = 'center';
  }, [backgroundUrl]);

  const handleRefresh = async () => {
    window.location.reload();
  };

  return (
    <AuthProvider>
      <Router>
        <div className="app content-overlay">
          <TopNavigation />

          <PullToRefresh onRefresh={handleRefresh}>
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
          </PullToRefresh>
        </div>
        <BottomNavigation />
      </Router>
    </AuthProvider>
  );
}

export default App;

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, NavLink } from 'react-router-dom';
import { Container, Nav, Navbar } from 'react-bootstrap';
import './App.css';
import DishList from './components/DishList';
import IngredientManager from './components/IngredientManager';
import TagManager from './components/TagManager';
import DishDetail from './components/DishDetail';

function App() {
  return (
    <Router>
      <div className="App">
        <Navbar bg="dark" variant="dark" expand="lg" className="mb-4">
          <Container>
            <Navbar.Brand as={Link} to="/">
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
            </Navbar.Collapse>
          </Container>
        </Navbar>

        <Container>
          <Routes>
            <Route path="/" element={<DishList />} />
            <Route path="/dishes" element={<DishList />} />
            <Route path="/dishes/:id" element={<DishDetail />} />
            <Route path="/ingredients" element={<IngredientManager />} />
            <Route path="/tags" element={<TagManager />} />
          </Routes>
        </Container>
      </div>
    </Router>
  );
}

export default App;

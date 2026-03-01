import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './App.css';
import DishList from './components/DishList';
import IngredientManager from './components/IngredientManager';
import DishDetail from './components/DishDetail';

function App() {
  return (
    <Router>
      <div className="App">
        <header className="App-header">
          <nav style={{ marginBottom: '20px' }}>
            <Link to="/dishes">
              <button>Dishes</button>
            </Link>
            <Link to="/ingredients">
              <button>Ingredients</button>
            </Link>
          </nav>

          <Routes>
            <Route path="/" element={<DishList />} />
            <Route path="/dishes" element={<DishList />} />
            <Route path="/dishes/:id" element={<DishDetail />} />
            <Route path="/ingredients" element={<IngredientManager />} />
          </Routes>
        </header>
      </div>
    </Router>
  );
}

export default App;

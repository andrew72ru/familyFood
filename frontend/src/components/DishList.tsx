import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Dish } from '../types/Dish';
import { fetchApi } from '../api';
import DishForm from './DishForm';

const DishList: React.FC = () => {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [editingDish, setEditingDish] = useState<Dish | null | 'new'>(null);
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const fetchDishes = React.useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchApi(`/api/dishes?page=${page}`);
      const fetchedDishes = data['hydra:member'] || data['member'] || [];
      setDishes(fetchedDishes);
      setTotalItems(data['hydra:totalItems'] || data['totalItems'] || 0);
      setLoading(false);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchDishes();
  }, [fetchDishes]);

  if (loading) {
    return <div>Loading dishes...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      <h1>Dishes</h1>
      {!editingDish && <button onClick={() => setEditingDish('new')}>Add New Dish</button>}

      {editingDish && (
        <DishForm
          dish={editingDish === 'new' ? undefined : editingDish}
          onSave={() => {
            setEditingDish(null);
            fetchDishes();
          }}
          onCancel={() => setEditingDish(null)}
        />
      )}

      {dishes.length === 0 ? (
        <p>No dishes found.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {dishes.map((dish) => (
            <li
              key={dish.id || dish['@id']}
              style={{ border: '1px solid #eee', margin: '10px 0', padding: '10px' }}
            >
              <Link
                to={`/dishes/${dish.id || dish['@id']?.split('/').pop()}`}
                style={{ textDecoration: 'none' }}
              >
                <h2 style={{ cursor: 'pointer', color: '#007bff', margin: 0 }}>{dish.name}</h2>
              </Link>
              <p>{dish.description}</p>
            </li>
          ))}
        </ul>
      )}

      <div style={{ marginTop: '20px' }}>
        <button disabled={page <= 1} onClick={() => setPage((prev) => prev - 1)}>
          Previous
        </button>
        <span style={{ margin: '0 10px' }}>Page {page}</span>
        <button
          disabled={dishes.length < 30 && page * 30 >= totalItems}
          onClick={() => setPage((prev) => prev + 1)}
        >
          Next
        </button>
        <div style={{ fontSize: '0.8em', color: '#666', marginTop: '5px' }}>
          Total items: {totalItems}
        </div>
      </div>
    </div>
  );
};

export default DishList;

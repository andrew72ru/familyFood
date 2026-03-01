import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Dish, DishIngredient } from '../types/Dish';
import { fetchApi } from '../api';
import DishForm from './DishForm';

const DishDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [dish, setDish] = useState<Dish | null>(null);
  const [dishIngredients, setDishIngredients] = useState<DishIngredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const fetchDish = React.useCallback(async () => {
    if (!id) return;
    try {
      const data = await fetchApi(`/api/dishes/${id}`);
      setDish(data);

      // Fetch full dish ingredients if they are IRIs
      if (data.dishIngredients && Array.isArray(data.dishIngredients)) {
        const fullIngredients = await Promise.all(
          data.dishIngredients.map(async (di: any) => {
            if (typeof di === 'string') {
              const diData = await fetchApi(di);
              // Also fetch nested ingredient if it's an IRI
              if (typeof diData.ingredient === 'string') {
                diData.ingredient = await fetchApi(diData.ingredient);
              }
              return diData;
            }
            // If it's already an object, check nested ingredient
            if (di.ingredient && typeof di.ingredient === 'string') {
              di.ingredient = await fetchApi(di.ingredient);
            }
            return di;
          }),
        );
        setDishIngredients(fullIngredients);
      } else {
        setDishIngredients([]);
      }

      setLoading(false);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDish();
  }, [fetchDish]);

  const handleDelete = async () => {
    if (!dish?.['@id'] || !window.confirm('Are you sure?')) return;
    try {
      await fetchApi(dish['@id'], { method: 'DELETE' });
      navigate('/dishes');
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) return <div>Loading dish details...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!dish) return <div>Dish not found.</div>;

  if (isEditing) {
    return (
      <DishForm
        dish={dish}
        onSave={() => {
          setIsEditing(false);
          fetchDish();
        }}
        onCancel={() => setIsEditing(false)}
      />
    );
  }

  return (
    <div
      style={{
        border: '1px solid #ccc',
        padding: '20px',
        margin: '20px 0',
        backgroundColor: '#f9f9f9',
        textAlign: 'left',
        color: '#333',
      }}
    >
      <button onClick={() => navigate('/dishes')} style={{ float: 'right' }}>
        Back to List
      </button>
      <h2>{dish.name}</h2>
      <p>
        <strong>Description:</strong> {dish.description}
      </p>

      {dish.recipe && (
        <div style={{ marginTop: '15px' }}>
          <strong>Recipe:</strong>
          <p style={{ whiteSpace: 'pre-wrap' }}>{dish.recipe.text}</p>
        </div>
      )}

      {dishIngredients.length > 0 && (
        <div style={{ marginTop: '15px' }}>
          <strong>Ingredients:</strong>
          <ul>
            {dishIngredients.map((di: DishIngredient, index: number) => (
              <li key={index}>
                {typeof di.ingredient === 'object' ? di.ingredient.name : di.ingredient} -{' '}
                {di.weight}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div style={{ marginTop: '20px' }}>
        <button onClick={() => setIsEditing(true)} style={{ marginRight: '10px' }}>
          Edit
        </button>
        <button onClick={handleDelete} style={{ color: 'red' }}>
          Delete
        </button>
      </div>
    </div>
  );
};

export default DishDetail;

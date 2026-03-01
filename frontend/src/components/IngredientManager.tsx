import React, { useEffect, useState } from 'react';
import { Ingredient } from '../types/Dish';
import { fetchApi } from '../api';

const IngredientManager: React.FC = () => {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [newIngredientName, setNewIngredientName] = useState('');
  const [newIngredientPrice, setNewIngredientPrice] = useState<number | ''>('');
  const [newIngredientUnit, setNewIngredientUnit] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editingPrice, setEditingPrice] = useState<number | ''>('');
  const [editingUnit, setEditingUnit] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const fetchIngredients = React.useCallback(async () => {
    try {
      const data = await fetchApi(`/api/ingredients?page=${page}`);
      setIngredients(data['hydra:member'] || data['member'] || []);
      setTotalItems(data['hydra:totalItems'] || data['totalItems'] || 0);
    } catch (err: any) {
      setError(err.message);
    }
  }, [page]);

  useEffect(() => {
    fetchIngredients();
  }, [fetchIngredients]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = { name: newIngredientName };
      if (newIngredientPrice !== '' || newIngredientUnit !== '') {
        payload.price = {
          price: newIngredientPrice !== '' ? Number(newIngredientPrice) : null,
          unit: newIngredientUnit || null,
        };
      }
      await fetchApi('/api/ingredients', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setNewIngredientName('');
      setNewIngredientPrice('');
      setNewIngredientUnit('');
      fetchIngredients();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure?')) return;
    try {
      await fetchApi(id, { method: 'DELETE' });
      fetchIngredients();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    try {
      const payload: any = { name: editingName };
      payload.price = {
        price: editingPrice !== '' ? Number(editingPrice) : null,
        unit: editingUnit || null,
      };
      await fetchApi(editingId, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
      setEditingId(null);
      fetchIngredients();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div>
      <h3>Ingredients</h3>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <form onSubmit={handleCreate}>
        <input
          value={newIngredientName}
          onChange={(e) => setNewIngredientName(e.target.value)}
          placeholder="New ingredient name"
          required
        />
        <input
          type="number"
          value={newIngredientPrice}
          onChange={(e) =>
            setNewIngredientPrice(e.target.value === '' ? '' : Number(e.target.value))
          }
          placeholder="Price"
        />
        <input
          value={newIngredientUnit}
          onChange={(e) => setNewIngredientUnit(e.target.value)}
          placeholder="Unit"
        />
        <button type="submit">Add Ingredient</button>
      </form>

      <ul>
        {ingredients.map((ing) => (
          <li key={ing['@id']}>
            {editingId === ing['@id'] ? (
              <form onSubmit={handleUpdate} style={{ display: 'inline' }}>
                <input
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  required
                />
                <input
                  type="number"
                  value={editingPrice}
                  onChange={(e) =>
                    setEditingPrice(e.target.value === '' ? '' : Number(e.target.value))
                  }
                  placeholder="Price"
                />
                <input
                  value={editingUnit}
                  onChange={(e) => setEditingUnit(e.target.value)}
                  placeholder="Unit"
                />
                <button type="submit">Save</button>
                <button type="button" onClick={() => setEditingId(null)}>
                  Cancel
                </button>
              </form>
            ) : (
              <>
                {ing.name}{' '}
                {ing.price?.price && `(${ing.price.price} per ${ing.price.unit || 'unit'})`}
                <button
                  onClick={() => {
                    setEditingId(ing['@id']!);
                    setEditingName(ing.name!);
                    setEditingPrice(ing.price?.price ?? '');
                    setEditingUnit(ing.price?.unit ?? '');
                  }}
                >
                  Edit
                </button>
                <button onClick={() => handleDelete(ing['@id']!)}>Delete</button>
              </>
            )}
          </li>
        ))}
      </ul>

      <div style={{ marginTop: '20px' }}>
        <button disabled={page <= 1} onClick={() => setPage((prev) => prev - 1)}>
          Previous
        </button>
        <span style={{ margin: '0 10px' }}>Page {page}</span>
        <button
          disabled={ingredients.length < 30 && page * 30 >= totalItems}
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

export default IngredientManager;

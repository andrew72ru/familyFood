import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button, Form, Table, Alert, InputGroup } from 'react-bootstrap';
import { Ingredient } from '../types/Dish';
import { fetchApi } from '../api';
import Pagination from './Pagination';

const IngredientManager: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
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
  const searchTerm = searchParams.get('search') || '';
  const [searchInput, setSearchInput] = useState(searchTerm);

  const fetchIngredients = React.useCallback(async () => {
    try {
      let url = `/api/ingredients?page=${page}`;
      if (searchTerm) {
        url += `&search[name]=${encodeURIComponent(searchTerm)}`;
      }
      const data = await fetchApi(url);
      setIngredients(data['hydra:member'] || data['member'] || []);
      setTotalItems(data['hydra:totalItems'] || data['totalItems'] || 0);
    } catch (err: any) {
      setError(err.message);
    }
  }, [page, searchTerm]);

  useEffect(() => {
    setSearchInput(searchTerm);
  }, [searchTerm]);

  useEffect(() => {
    fetchIngredients();
  }, [fetchIngredients]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput) {
      setSearchParams({ search: searchInput });
    } else {
      setSearchParams({});
    }
    setPage(1);
  };

  const handleReset = () => {
    setSearchInput('');
    setSearchParams({});
    setPage(1);
  };

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
    <div className="mb-5">
      <h3>Ingredients</h3>
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <div className="mb-4">
        <Form onSubmit={handleSearch}>
          <InputGroup>
            <Form.Control
              type="text"
              placeholder="Search ingredients by name..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            <Button variant="outline-secondary" type="submit">
              Search
            </Button>
            <Button variant="outline-danger" type="button" onClick={handleReset}>
              Reset
            </Button>
          </InputGroup>
        </Form>
      </div>

      <Form onSubmit={handleCreate} className="mb-4">
        <InputGroup>
          <Form.Control
            value={newIngredientName}
            onChange={(e) => setNewIngredientName(e.target.value)}
            placeholder="New ingredient name"
            required
          />
          <Form.Control
            type="number"
            value={newIngredientPrice}
            onChange={(e) =>
              setNewIngredientPrice(e.target.value === '' ? '' : Number(e.target.value))
            }
            placeholder="Price"
          />
          <Form.Control
            value={newIngredientUnit}
            onChange={(e) => setNewIngredientUnit(e.target.value)}
            placeholder="Unit"
          />
          <Button type="submit" variant="primary">
            Add
          </Button>
        </InputGroup>
      </Form>

      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>Name</th>
            <th>Price</th>
            <th>Unit</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {ingredients.map((ing) => (
            <tr key={ing['@id']}>
              {editingId === ing['@id'] ? (
                <>
                  <td>
                    <Form.Control
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      required
                    />
                  </td>
                  <td>
                    <Form.Control
                      type="number"
                      value={editingPrice}
                      onChange={(e) =>
                        setEditingPrice(e.target.value === '' ? '' : Number(e.target.value))
                      }
                      placeholder="Price"
                    />
                  </td>
                  <td>
                    <Form.Control
                      value={editingUnit}
                      onChange={(e) => setEditingUnit(e.target.value)}
                      placeholder="Unit"
                    />
                  </td>
                  <td>
                    <Button variant="success" size="sm" onClick={handleUpdate} className="me-2">
                      Save
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => setEditingId(null)}>
                      Cancel
                    </Button>
                  </td>
                </>
              ) : (
                <>
                  <td>{ing.name}</td>
                  <td>{ing.price?.price ?? '-'}</td>
                  <td>{ing.price?.unit ?? '-'}</td>
                  <td>
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={() => {
                        setEditingId(ing['@id']!);
                        setEditingName(ing.name!);
                        setEditingPrice(ing.price?.price ?? '');
                        setEditingUnit(ing.price?.unit ?? '');
                      }}
                      className="me-2"
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => handleDelete(ing['@id']!)}
                    >
                      Delete
                    </Button>
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </Table>

      <Pagination
        currentPage={page}
        totalItems={totalItems}
        itemsPerPage={30}
        onPageChange={setPage}
      />
    </div>
  );
};

export default IngredientManager;

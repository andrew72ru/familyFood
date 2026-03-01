import React, { useState, useEffect } from 'react';
import { Form, Button, ListGroup, InputGroup, Alert, Spinner, Tabs, Tab } from 'react-bootstrap';
import ReactMarkdown from 'react-markdown';
import { Dish, Ingredient, DishIngredient } from '../types/Dish';
import { fetchApi } from '../api';

interface DishFormProps {
  dish?: Dish;
  onSave: () => void;
  onCancel: () => void;
}

const DishForm: React.FC<DishFormProps> = ({ dish, onSave, onCancel }) => {
  const [name, setName] = useState(dish?.name || '');
  const [description, setDescription] = useState(dish?.description || '');
  const [recipeText, setRecipeText] = useState(dish?.recipe?.text || '');
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [selectedIngredient, setSelectedIngredient] = useState<string>('');
  const [weight, setWeight] = useState<string>('');
  const [dishIngredients, setDishIngredients] = useState<DishIngredient[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchApi('/api/ingredients').then((data) =>
      setIngredients(data['hydra:member'] || data['member'] || []),
    );
    if (dish && dish.dishIngredients) {
      const loadDishIngredients = async () => {
        setLoading(true);
        const fullIngredients = await Promise.all(
          (dish.dishIngredients as any[]).map(async (di: any) => {
            if (typeof di === 'string') {
              const diData = await fetchApi(di);
              if (typeof diData.ingredient === 'string') {
                diData.ingredient = await fetchApi(diData.ingredient);
              }
              return diData;
            }
            if (di.ingredient && typeof di.ingredient === 'string') {
              const ingredientData = await fetchApi(di.ingredient);
              return { ...di, ingredient: ingredientData };
            }
            return di;
          }),
        );
        setDishIngredients(fullIngredients);
        setLoading(false);
      };
      loadDishIngredients();
    }
  }, [dish]);

  const handleAddIngredient = async () => {
    if (!selectedIngredient || !weight) return;
    const ingredient = ingredients.find((i) => i['@id'] === selectedIngredient);
    if (!ingredient) return;

    const newDishIng: DishIngredient = {
      ingredient: selectedIngredient,
      weight: weight,
    };

    setDishIngredients([...dishIngredients, { ...newDishIng, ingredient }]);
    setSelectedIngredient('');
    setWeight('');
  };

  const handleRemoveIngredient = (index: number) => {
    setDishIngredients(dishIngredients.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const payload: any = {
        name,
        description,
        recipe: { text: recipeText },
      };

      let savedDish: Dish;
      if (dish?.['@id']) {
        savedDish = await fetchApi(dish['@id'], {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
      } else {
        savedDish = await fetchApi('/api/dishes', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }

      for (const di of dishIngredients) {
        if (!di['@id']) {
          await fetchApi('/api/dish_ingredients', {
            method: 'POST',
            body: JSON.stringify({
              weight: di.weight,
              dish: savedDish['@id'],
              ingredient:
                typeof di.ingredient === 'string' ? di.ingredient : di.ingredient?.['@id'],
            }),
          });
        }
      }

      setLoading(false);
      onSave();
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  if (loading && !name) {
    return (
      <div className="text-center p-5">
        <Spinner animation="border" />
      </div>
    );
  }

  return (
    <Form onSubmit={handleSubmit} className="p-2">
      <h4 className="mb-3">{dish ? 'Edit Dish' : 'Create Dish'}</h4>
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Form.Group className="mb-3">
        <Form.Label>Name</Form.Label>
        <Form.Control
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="Enter dish name"
        />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Description</Form.Label>
        <Form.Control
          as="textarea"
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Enter dish description"
        />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Recipe Instructions</Form.Label>
        <Tabs defaultActiveKey="edit" className="mb-2">
          <Tab eventKey="edit" title="Edit">
            <Form.Control
              as="textarea"
              rows={4}
              value={recipeText}
              onChange={(e) => setRecipeText(e.target.value)}
              placeholder="Enter recipe instructions (Markdown supported)"
            />
          </Tab>
          <Tab eventKey="preview" title="Preview">
            <div className="p-3 border rounded bg-white" style={{ minHeight: '106px' }}>
              <ReactMarkdown>{recipeText || '*No recipe content*'}</ReactMarkdown>
            </div>
          </Tab>
        </Tabs>
      </Form.Group>

      <hr />
      <h5 className="mb-3">Ingredients</h5>
      <ListGroup className="mb-3">
        {dishIngredients.map((di, index) => (
          <ListGroup.Item key={index} className="d-flex justify-content-between align-items-center">
            <div>
              <span className="fw-bold">{(di.ingredient as Ingredient)?.name}</span>
              <span className="text-muted ms-2">— {di.weight}</span>
            </div>
            <Button
              variant="outline-danger"
              size="sm"
              onClick={() => handleRemoveIngredient(index)}
            >
              Remove
            </Button>
          </ListGroup.Item>
        ))}
      </ListGroup>

      <div className="bg-light p-3 rounded mb-4">
        <h6 className="mb-3">Add Ingredient</h6>
        <InputGroup>
          <Form.Select
            value={selectedIngredient}
            onChange={(e) => setSelectedIngredient(e.target.value)}
          >
            <option value="">Select Ingredient</option>
            {ingredients.map((ing) => (
              <option key={ing['@id']} value={ing['@id']}>
                {ing.name}
              </option>
            ))}
          </Form.Select>
          <Form.Control
            placeholder="Weight (e.g. 500g)"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
          />
          <Button variant="outline-primary" onClick={handleAddIngredient}>
            Add
          </Button>
        </InputGroup>
      </div>

      <div className="d-flex gap-2">
        <Button variant="success" type="submit" disabled={loading}>
          {loading ? 'Saving...' : 'Save Dish'}
        </Button>
        <Button variant="secondary" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
      </div>
    </Form>
  );
};

export default DishForm;

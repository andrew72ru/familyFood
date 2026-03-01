import React, { useState, useEffect } from 'react';
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

  useEffect(() => {
    fetchApi('/api/ingredients').then(data => setIngredients(data['hydra:member'] || data['member'] || []));
    if (dish && dish.dishIngredients) {
      const loadDishIngredients = async () => {
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
          })
        );
        setDishIngredients(fullIngredients);
      };
      loadDishIngredients();
    }
  }, [dish]);

  const handleAddIngredient = async () => {
    if (!selectedIngredient || !weight) return;
    const ingredient = ingredients.find(i => i['@id'] === selectedIngredient);
    if (!ingredient) return;

    const newDishIng: DishIngredient = {
      ingredient: selectedIngredient,
      weight: weight,
      // We don't have an ID yet if it's new
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

      // Handle DishIngredients
      // This is a bit complex because we need to link them to the savedDish.
      // API Platform usually allows nested writes if configured, but let's do it explicitly if needed.
      // Actually, if we want to be safe, we create/update DishIngredient entities separately.

      for (const di of dishIngredients) {
        if (!di['@id']) {
           await fetchApi('/api/dish_ingredients', {
             method: 'POST',
             body: JSON.stringify({
               weight: di.weight,
               dish: savedDish['@id'],
               ingredient: typeof di.ingredient === 'string' ? di.ingredient : di.ingredient?.['@id']
             })
           });
        }
      }

      onSave();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ border: '1px solid #ccc', padding: '10px', margin: '10px 0' }}>
      <h4>{dish ? 'Edit Dish' : 'Create Dish'}</h4>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <div>
        <label>Name: </label>
        <input value={name} onChange={e => setName(e.target.value)} required />
      </div>
      <div>
        <label>Description: </label>
        <textarea value={description} onChange={e => setDescription(e.target.value)} />
      </div>
      <div>
        <label>Recipe: </label>
        <textarea value={recipeText} onChange={e => setRecipeText(e.target.value)} />
      </div>

      <h5>Ingredients</h5>
      <ul>
        {dishIngredients.map((di, index) => (
          <li key={index}>
            {(di.ingredient as Ingredient)?.name} - {di.weight}
            <button type="button" onClick={() => handleRemoveIngredient(index)}>Remove</button>
          </li>
        ))}
      </ul>

      <div>
        <select value={selectedIngredient} onChange={e => setSelectedIngredient(e.target.value)}>
          <option value="">Select Ingredient</option>
          {ingredients.map(ing => (
            <option key={ing['@id']} value={ing['@id']}>{ing.name}</option>
          ))}
        </select>
        <input placeholder="Weight" value={weight} onChange={e => setWeight(e.target.value)} />
        <button type="button" onClick={handleAddIngredient}>Add</button>
      </div>

      <div style={{ marginTop: '10px' }}>
        <button type="submit">Save Dish</button>
        <button type="button" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
};

export default DishForm;

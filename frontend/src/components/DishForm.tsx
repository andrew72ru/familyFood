import React, { useState, useEffect, useRef } from 'react';
import { Form, Button, ListGroup, InputGroup, Spinner, Tabs, Tab, Badge } from 'react-bootstrap';
import ReactMarkdown from 'react-markdown';
import Select from 'react-select';
import { Dish, Ingredient, DishIngredient, Tag } from '../types/Dish';
import { fetchApi } from '../api';
import ErrorDisplay from './ErrorDisplay';
import { useTranslation } from 'react-i18next';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';

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
  const [tags, setTags] = useState<Tag[]>((dish?.tags as Tag[]) || []);
  const [tagInput, setTagInput] = useState('');
  const [suggestedTags, setSuggestedTags] = useState<Tag[]>([]);
  const [error, setError] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();
  const recipeRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (recipeRef.current) {
      recipeRef.current.style.height = 'auto';
      // Height for all text + 3 extra lines (approx 75px extra, assuming 25px per line)
      const newHeight = Math.max(recipeRef.current.scrollHeight + 75, 100);
      recipeRef.current.style.height = `${newHeight}px`;
    }
  }, []); // Only on mount

  useEffect(() => {
    const fetchSuggestedTags = async () => {
      if (tagInput.trim().length > 1) {
        try {
          const data = await fetchApi(`/api/tags?search[name]=${encodeURIComponent(tagInput)}`);
          setSuggestedTags(data['hydra:member'] || data['member'] || []);
        } catch (err) {
          console.error('Error fetching tags', err);
        }
      } else {
        setSuggestedTags([]);
      }
    };
    const timer = setTimeout(fetchSuggestedTags, 300);
    return () => clearTimeout(timer);
  }, [tagInput]);

  useEffect(() => {
    fetchApi('/api/ingredients?pagination=0').then((data) =>
      setIngredients(data['hydra:member'] || data['member'] || []),
    );
    if (dish) {
      const loadData = async () => {
        setLoading(true);
        // Load tags if they are IRIs
        if (dish.tags && dish.tags.length > 0) {
          const fullTags = await Promise.all(
            dish.tags.map(async (t: any) => (typeof t === 'string' ? await fetchApi(t) : t)),
          );
          setTags(fullTags);
        }

        if (dish.dishIngredients) {
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
        }
        setLoading(false);
      };
      loadData();
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

  const handleWeightChange = (index: number, newWeight: string) => {
    const updatedIngredients = [...dishIngredients];
    updatedIngredients[index] = { ...updatedIngredients[index], weight: newWeight };
    setDishIngredients(updatedIngredients);
  };

  const handleWeightBlur = async (index: number) => {
    const di = dishIngredients[index];
    if (di['@id']) {
      try {
        await fetchApi(di['@id'], {
          method: 'PATCH',
          body: JSON.stringify({
            weight: di.weight,
          }),
        });
      } catch (err: any) {
        setError(err);
      }
    }
  };
  const handleAddTag = (tag: Tag) => {
    if (!tags.find((t) => t.name === tag.name)) {
      setTags([...tags, tag]);
    }
    setTagInput('');
    setSuggestedTags([]);
  };

  const handleCreateTag = () => {
    const tagName = tagInput.trim();
    if (tagName && !tags.find((t) => t.name?.toLowerCase() === tagName.toLowerCase())) {
      setTags([...tags, { name: tagName }]);
    }
    setTagInput('');
    setSuggestedTags([]);
  };

  const handleRemoveTag = (tagName: string) => {
    setTags(tags.filter((t) => t.name !== tagName));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);

      // Handle tags: find or create
      const finalTagIris = await Promise.all(
        tags.map(async (tag) => {
          if (tag['@id']) return tag['@id'];
          // Try to find tag by name again just in case
          const data = await fetchApi(`/api/tags?search[name]=${encodeURIComponent(tag.name!)}`);
          const existingTags = data['hydra:member'] || data['member'] || [];
          const match = existingTags.find((t: Tag) => t.name?.toLowerCase() === tag.name?.toLowerCase());
          if (match) return match['@id'];

          // Create new tag
          const newTag = await fetchApi('/api/tags', {
            method: 'POST',
            body: JSON.stringify({ name: tag.name }),
          });
          return newTag['@id'];
        }),
      );

      const payload: any = {
        name,
        description,
        recipe: { text: recipeText },
        tags: finalTagIris,
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
              ingredient: typeof di.ingredient === 'string' ? di.ingredient : di.ingredient?.['@id'],
            }),
          });
        } else {
          // Update existing dish ingredient if weight changed
          // We can always update it for simplicity or check if it actually changed
          await fetchApi(di['@id'], {
            method: 'PATCH',
            body: JSON.stringify({
              weight: di.weight,
            }),
          });
        }
      }

      setLoading(false);
      onSave();
    } catch (err: any) {
      setError(err);
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
      <ErrorDisplay error={error} onClose={() => setError(null)} className="mb-3" />

      <Form.Group className="mb-3">
        <Form.Label>{t('Name')}</Form.Label>
        <Form.Control value={name} onChange={(e) => setName(e.target.value)} required placeholder="Enter dish name" />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>{t('Description')}</Form.Label>
        <Form.Control
          as="textarea"
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t('Enter dish description')}
        />
      </Form.Group>

      <Form.Group className="mb-4">
        <Form.Label>{t('Tags')}</Form.Label>
        <div className="mb-2">
          {tags.map((tag, idx) => (
            <Badge key={idx} bg="primary" className="me-2 p-2">
              {tag.name}
              <span className="ms-2" style={{ cursor: 'pointer' }} onClick={() => handleRemoveTag(tag.name!)}>
                &times;
              </span>
            </Badge>
          ))}
        </div>
        <div className="position-relative">
          <InputGroup>
            <Form.Control
              type="text"
              placeholder={t('Type tag name')}
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleCreateTag();
                }
              }}
            />
            <Button variant="outline-primary" onClick={handleCreateTag}>
              Add
            </Button>
          </InputGroup>
          {suggestedTags.length > 0 && (
            <ListGroup className="position-absolute w-100 shadow" style={{ zIndex: 1000, top: '100%' }}>
              {suggestedTags.map((tag) => (
                <ListGroup.Item key={tag['@id']} action onClick={() => handleAddTag(tag)} className="py-2">
                  {tag.name}
                </ListGroup.Item>
              ))}
            </ListGroup>
          )}
        </div>
        <Form.Text className="text-muted">{t('Type and press Enter to add a new tag.')}</Form.Text>
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>{t('Recipe Instructions')}</Form.Label>
        <Tabs defaultActiveKey="edit" className="mb-2">
          <Tab eventKey="edit" title="Edit">
            <Form.Control
              as="textarea"
              ref={recipeRef}
              rows={4}
              value={recipeText}
              onChange={(e) => setRecipeText(e.target.value)}
              placeholder={t('Enter recipe instructions (Markdown supported)')}
              style={{ overflowY: 'auto' }}
            />
          </Tab>
          <Tab eventKey="preview" title={t('Preview')}>
            <div className="p-3 border rounded bg-white" style={{ minHeight: '106px' }}>
              <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
                {recipeText || '*No recipe content*'}
              </ReactMarkdown>
            </div>
          </Tab>
        </Tabs>
      </Form.Group>

      <hr />
      <h5 className="mb-3">Ingredients</h5>
      <ListGroup className="mb-3">
        {dishIngredients.map((di, index) => (
          <ListGroup.Item key={index} className="d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center flex-grow-1 me-3">
              <span className="fw-bold me-3" style={{ minWidth: '150px' }}>
                {(di.ingredient as Ingredient)?.name}
              </span>
              <Form.Control
                size="sm"
                placeholder={t('Weight')}
                value={di.weight || ''}
                onChange={(e) => handleWeightChange(index, e.target.value)}
                onBlur={() => handleWeightBlur(index)}
                style={{ maxWidth: '120px' }}
              />
            </div>
            <Button variant="outline-danger" size="sm" onClick={() => handleRemoveIngredient(index)}>
              {t('Remove')}
            </Button>
          </ListGroup.Item>
        ))}
      </ListGroup>

      <div className="bg-light p-3 rounded mb-4">
        <h6 className="mb-3">{t('Add Ingredient')}</h6>
        <div className="d-flex flex-column flex-md-row gap-2 align-items-md-center">
          <div className="flex-grow-1">
            <Select
              classNamePrefix="react-select"
              options={ingredients.map((ing) => ({
                value: ing['@id'] || '',
                label: ing.name || '',
              }))}
              value={
                selectedIngredient
                  ? {
                      value: selectedIngredient,
                      label: ingredients.find((i) => i['@id'] === selectedIngredient)?.name || '',
                    }
                  : null
              }
              onChange={(option: any) => setSelectedIngredient(option ? option.value : '')}
              placeholder={t('Select Ingredient')}
              isClearable
            />
          </div>
          <div className="d-flex gap-2">
            <Form.Control
              placeholder={t('weight_example')}
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="flex-grow-1"
              style={{ minWidth: '150px', maxWidth: '250px' }}
            />
            <Button variant="outline-primary" onClick={handleAddIngredient}>
              {t('Add')}
            </Button>
          </div>
        </div>
      </div>

      <div className="d-flex gap-2">
        <Button variant="success" type="submit" disabled={loading}>
          {loading ? t('Saving') : t('Save Dish')}
        </Button>
        <Button variant="secondary" onClick={onCancel} disabled={loading}>
          {t('Cancel')}
        </Button>
      </div>
    </Form>
  );
};

export default DishForm;

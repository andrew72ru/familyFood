import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Button,
  Card,
  ListGroup,
  Spinner,
  Alert,
  Container,
  Row,
  Col,
  Badge,
} from 'react-bootstrap';
import ReactMarkdown from 'react-markdown';
import { Dish, DishIngredient, Ingredient, Tag } from '../types/Dish';
import { fetchApi } from '../api';
import DishForm from './DishForm';
import ErrorDisplay from './ErrorDisplay';

const DishDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [dish, setDish] = useState<Dish | null>(null);
  const [dishIngredients, setDishIngredients] = useState<DishIngredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const fetchDish = React.useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
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
      setError(err);
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
      setError(err);
    }
  };

  if (loading) {
    return (
      <div className="text-center mt-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading dish details...</span>
        </Spinner>
      </div>
    );
  }

  if (error) {
    return <ErrorDisplay error={error} onClose={() => setError(null)} />;
  }

  if (!dish) {
    return (
      <Alert variant="warning" className="mt-3">
        Dish not found.
      </Alert>
    );
  }

  if (isEditing) {
    return (
      <Card className="mt-3">
        <Card.Body>
          <DishForm
            dish={dish}
            onSave={() => {
              setIsEditing(false);
              fetchDish();
            }}
            onCancel={() => setIsEditing(false)}
          />
        </Card.Body>
      </Card>
    );
  }

  return (
    <Container className="py-4">
      <Row className="justify-content-center">
        <Col md={10} lg={8}>
          <Card className="shadow-sm">
            <Card.Header className="d-flex justify-content-between align-items-center bg-white py-3">
              <div>
                <h2 className="mb-1">{dish.name}</h2>
                {dish.tags && dish.tags.length > 0 && (
                  <div>
                    {(dish.tags as Tag[]).map((tag, idx) => (
                      <Badge key={idx} bg="info" pill className="me-1">
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              <Button variant="outline-secondary" size="sm" onClick={() => navigate('/dishes')}>
                Back to List
              </Button>
            </Card.Header>
            <Card.Body>
              <div className="mb-4">
                <h5 className="text-muted border-bottom pb-2">Description</h5>
                <p>{dish.description || 'No description provided.'}</p>
              </div>

              {dish.recipe && (
                <div className="mb-4">
                  <h5 className="text-muted border-bottom pb-2">Recipe</h5>
                  <div className="markdown-body">
                    <ReactMarkdown>{dish.recipe.text || ''}</ReactMarkdown>
                  </div>
                </div>
              )}

              {dishIngredients.length > 0 && (
                <div className="mb-4">
                  <h5 className="text-muted border-bottom pb-2">Ingredients</h5>
                  <ListGroup variant="flush">
                    {dishIngredients.map((di: DishIngredient, index: number) => (
                      <ListGroup.Item key={index} className="px-0">
                        <span className="fw-bold">
                          {typeof di.ingredient === 'object'
                            ? (di.ingredient as Ingredient).name
                            : di.ingredient}
                        </span>
                        <span className="text-muted ms-2">— {di.weight}</span>
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                </div>
              )}
            </Card.Body>
            <Card.Footer className="bg-white py-3">
              <Button variant="primary" onClick={() => setIsEditing(true)} className="me-2">
                Edit Dish
              </Button>
              <Button variant="danger" onClick={handleDelete}>
                Delete Dish
              </Button>
            </Card.Footer>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default DishDetail;

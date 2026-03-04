import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Card, Spinner, Alert, Container, Row, Col } from 'react-bootstrap';
import { Dish, DishIngredient, Ingredient } from '../types/Dish';
import { fetchApi } from '../api';
import ErrorDisplay from './ErrorDisplay';

const DishIngredients: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [dish, setDish] = useState<Dish | null>(null);
  const [dishIngredients, setDishIngredients] = useState<DishIngredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any | null>(null);

  const fetchDish = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await fetchApi(`/api/dishes/${id}`);
      setDish(data);

      if (data.dishIngredients && Array.isArray(data.dishIngredients)) {
        const fullIngredients = await Promise.all(
          data.dishIngredients.map(async (di: any) => {
            if (typeof di === 'string') {
              const diData = await fetchApi(di);
              if (typeof diData.ingredient === 'string') {
                diData.ingredient = await fetchApi(diData.ingredient);
              }
              return diData;
            }
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

  const copyToClipboard = () => {
    const text = dishIngredients
      .map((di) => {
        const name = typeof di.ingredient === 'object' ? di.ingredient.name : di.ingredient;
        return di.weight ? `${name} — ${di.weight}` : name;
      })
      .join('\n');
    navigator.clipboard.writeText(text);
  };

  if (loading) {
    return (
      <div className="text-center mt-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading ingredients...</span>
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

  return (
    <Container fluid={true} className="py-2 px-1">
      <Row className="justify-content-center">
        <Col md={10} lg={8}>
          <Card className="shadow">
            <Card.Header className="d-flex justify-content-between align-items-center py-3">
              <h2 className="mb-0">{dish.name} - Ingredients</h2>
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={() => navigate(`/dishes/${id}`)}
              >
                Back to Detail
              </Button>
            </Card.Header>
            <Card.Body>
              <ul className="list-unstyled mb-4">
                {dishIngredients.map((di: DishIngredient, index: number) => (
                  <li key={index} className="py-1">
                    <span className="fw-bold">
                      {typeof di.ingredient === 'object'
                        ? (di.ingredient as Ingredient).name
                        : di.ingredient}
                    </span>
                    {di.weight && <span className="text-muted ms-2">— {di.weight}</span>}
                  </li>
                ))}
              </ul>
              <Button variant="primary" onClick={copyToClipboard}>
                Copy to Clipboard
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default DishIngredients;

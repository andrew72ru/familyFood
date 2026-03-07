import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Card, Spinner, Alert, Container, Row, Col } from 'react-bootstrap';
import { DishIngredient, Ingredient } from '../types/Dish';
import { useDish } from '../hooks/useDish';
import ErrorDisplay from './ErrorDisplay';
import { useTranslation } from 'react-i18next';

const DishIngredients: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { dish, dishIngredients, loading, error, setError } = useDish(id);
  const [copied, setCopied] = useState(false);
  const { t } = useTranslation();

  const copyToClipboard = () => {
    const text = dishIngredients
      .map((di) => {
        const name = typeof di.ingredient === 'object' ? di.ingredient.name : di.ingredient;
        return di.weight ? `${name} — ${di.weight}` : name;
      })
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="text-center mt-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">{t('Loading ingredients')}...</span>
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
        {t('Dish not found.')}
      </Alert>
    );
  }

  return (
    <Container fluid={true} className="py-2 px-1">
      <Row className="justify-content-center">
        <Col md={10} lg={8}>
          <Card className="shadow">
            <Card.Header className="d-flex justify-content-between align-items-center py-3">
              <h2 className="mb-0">
                {dish.name} - {t('Ingredients')}
              </h2>
              <Button variant="outline-secondary" size="sm" onClick={() => navigate(`/dishes/${id}`)}>
                <i className="bi bi-arrow-left"></i>
              </Button>
            </Card.Header>
            <Card.Body>
              <ul className="list-unstyled mb-4">
                {dishIngredients.map((di: DishIngredient, index: number) => (
                  <li key={index} className="py-1">
                    <span className="fw-bold">
                      {typeof di.ingredient === 'object' ? (di.ingredient as Ingredient).name : di.ingredient}
                    </span>
                    {di.weight && <span className="text-muted ms-2">— {di.weight}</span>}
                  </li>
                ))}
              </ul>
              <Button variant={copied ? 'info' : 'primary'} onClick={copyToClipboard}>
                {copied ? t('Copied!') : t('Copy to Clipboard')}
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default DishIngredients;

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Card, ListGroup, Spinner, Alert, Container, Row, Col, Badge, Accordion } from 'react-bootstrap';
import ReactMarkdown from 'react-markdown';
import { DishIngredient, Ingredient, Tag } from '../types/Dish';
import { fetchApi } from '../api';
import { useDish } from '../hooks/useDish';
import DishForm from './DishForm';
import ErrorDisplay from './ErrorDisplay';
import RecipeComments from './RecipeComments';
import { useTranslation } from 'react-i18next';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';

const DishDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { dish, dishIngredients, recipeComments, loading, error, fetchDish, setError } = useDish(id);
  const [isEditing, setIsEditing] = useState(false);
  const [isFetchingRecipe, setIsFetchingRecipe] = useState(false);
  const [isExtractingIngredients, setIsExtractingIngredients] = useState(false);
  const [recipeFeedback, setRecipeFeedback] = useState<string | null>(null);
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

  const handleDelete = async () => {
    if (!dish?.['@id'] || !window.confirm('Are you sure?')) return;
    try {
      await fetchApi(dish['@id'], { method: 'DELETE' });
      navigate('/dishes');
    } catch (err: any) {
      setError(err);
    }
  };

  const handleGetRecipe = async () => {
    if (!dish?.id) return;
    try {
      setIsFetchingRecipe(true);
      setRecipeFeedback(null);
      await fetchApi('/api/get_recipes', {
        method: 'POST',
        body: JSON.stringify({ dishId: dish.id }),
      });
      setRecipeFeedback(t('extracting.recipe'));
    } catch (err: any) {
      setError(err);
    } finally {
      setIsFetchingRecipe(false);
    }
  };

  const handleExtractIngredients = async () => {
    if (!dish?.id) return;
    try {
      setIsExtractingIngredients(true);
      setRecipeFeedback(null);
      await fetchApi('/api/extract_ingredients', {
        method: 'POST',
        body: JSON.stringify({ dishId: dish.id }),
      });
      setRecipeFeedback(t('extracting.ingredients'));
    } catch (err: any) {
      setError(err);
    } finally {
      setIsExtractingIngredients(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center mt-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">{t('Loading dish details')}...</span>
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
    <Container fluid={true} className="py-2 px-1">
      <Row className="justify-content-center">
        <Col md={10} lg={8}>
          <Card className="shadow">
            <Card.Header className="d-flex justify-content-between align-items-center py-3">
              <div>
                <h2 className="mb-1">{dish.name}</h2>
                {dish.tags && dish.tags.length > 0 && (
                  <div>
                    {(dish.tags as Tag[]).map((tag, idx) => (
                      <Badge key={idx} bg="primary" pill={false} className="me-1">
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              <Button variant="outline-secondary" size="sm" onClick={() => window.location.reload()}>
                <i className="bi bi-arrow-clockwise"></i>
              </Button>
            </Card.Header>
            <Card.Body className="recipe-body">
              <div className="mb-4">
                <h5 className="text-muted border-bottom pb-2">{t('Description')}</h5>
                <p>{dish.description || t('No description provided.')}</p>
              </div>

              {dish.recipe && (
                <div className="mb-4">
                  <h5 className="text-muted border-bottom pb-2">Recipe</h5>
                  <div className="markdown-body">
                    <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>{dish.recipe.text || ''}</ReactMarkdown>
                  </div>
                </div>
              )}

              {recipeFeedback && (
                <Alert variant="info" className="mb-4" onClose={() => setRecipeFeedback(null)} dismissible>
                  {recipeFeedback}
                </Alert>
              )}

              {dishIngredients.length > 0 && (
                <div className="mb-4">
                  <h5 className="text-muted border-bottom pb-2">{t('Ingredients')}</h5>
                  <ListGroup variant="flush">
                    {dishIngredients.map((di: DishIngredient, index: number) => (
                      <ListGroup.Item key={index} className="px-2">
                        <span className="fw-bold">
                          {typeof di.ingredient === 'object' ? (di.ingredient as Ingredient).name : di.ingredient}
                        </span>
                        {di.weight && <span className="text-muted ms-2">— {di.weight}</span>}
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                </div>
              )}

              {dish['@id'] && (
                <RecipeComments
                  dishId={dish['@id']}
                  recipeComments={recipeComments}
                  onCommentChange={fetchDish}
                  setError={setError}
                />
              )}
            </Card.Body>
            <Card.Footer className="py-3">
              <div className="d-flex flex-column flex-md-row justify-content-md-between align-items-md-center">
                <Accordion className="w-100 me-md-4">
                  <Accordion.Item eventKey="0">
                    <Accordion.Header>{t('Actions')}</Accordion.Header>
                    <Accordion.Body>
                      <div className="d-grid gap-2 d-block">
                        <Button
                          variant="outline-primary"
                          onClick={handleGetRecipe}
                          disabled={isFetchingRecipe || (!!dish?.recipe?.text && dish.recipe.text.trim() !== '')}
                        >
                          {isFetchingRecipe ? (
                            <>
                              <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                              {t('Requesting')}...
                            </>
                          ) : (
                            t('Get a recipe')
                          )}
                        </Button>
                        <Button
                          variant="outline-primary"
                          onClick={handleExtractIngredients}
                          disabled={
                            isExtractingIngredients || !dish?.recipe?.text?.trim() || dishIngredients.length > 0
                          }
                        >
                          {isExtractingIngredients ? (
                            <>
                              <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                              {t('Extracting')}...
                            </>
                          ) : (
                            t('Extract ingredients')
                          )}
                        </Button>
                        <Button variant="primary" onClick={() => setIsEditing(true)}>
                          {t('Edit Dish')}
                        </Button>
                        <Button variant="danger" onClick={handleDelete}>
                          {t('Delete Dish')}
                        </Button>
                      </div>
                    </Accordion.Body>
                  </Accordion.Item>
                </Accordion>
                {dishIngredients.length > 0 && (
                  <div className="d-grid px-1 mt-3">
                    <Button
                      variant={copied ? 'info' : 'primary'}
                      onClick={copyToClipboard}
                      className="d-flex align-items-start"
                    >
                      <i className="bi bi-clipboard-check-fill me-2"></i>
                      <span className="text-start">{copied ? t('Copied!') : t('Copy to Clipboard')}</span>
                    </Button>
                  </div>
                )}
              </div>
            </Card.Footer>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default DishDetail;

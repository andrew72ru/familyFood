import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Card, Spinner, Alert, Row, Col } from 'react-bootstrap';
import { Dish } from '../types/Dish';
import { fetchApi } from '../api';
import DishForm from './DishForm';
import Pagination from './Pagination';

const DishList: React.FC = () => {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [editingDish, setEditingDish] = useState<Dish | null | 'new'>(null);
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const fetchDishes = React.useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchApi(`/api/dishes?page=${page}`);
      const fetchedDishes = data['hydra:member'] || data['member'] || [];
      setDishes(fetchedDishes);
      setTotalItems(data['hydra:totalItems'] || data['totalItems'] || 0);
      setLoading(false);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchDishes();
  }, [fetchDishes]);

  if (loading) {
    return (
      <div className="text-center mt-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading dishes...</span>
        </Spinner>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="danger" className="mt-3">
        Error: {error}
      </Alert>
    );
  }

  return (
    <div className="mb-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Dishes</h1>
        {!editingDish && (
          <Button variant="primary" onClick={() => setEditingDish('new')}>
            Add New Dish
          </Button>
        )}
      </div>

      {editingDish && (
        <Card className="mb-4">
          <Card.Body>
            <DishForm
              dish={editingDish === 'new' ? undefined : editingDish}
              onSave={() => {
                setEditingDish(null);
                fetchDishes();
              }}
              onCancel={() => setEditingDish(null)}
            />
          </Card.Body>
        </Card>
      )}

      {dishes.length === 0 ? (
        <Alert variant="info">No dishes found.</Alert>
      ) : (
        <Row xs={1} md={2} lg={3} className="g-4">
          {dishes.map((dish) => (
            <Col key={dish.id || dish['@id']}>
              <Card h-100>
                <Card.Body>
                  <Card.Title>
                    <Link
                      to={`/dishes/${dish.id || dish['@id']?.split('/').pop()}`}
                      className="text-decoration-none"
                    >
                      {dish.name}
                    </Link>
                  </Card.Title>
                  <Card.Text className="text-muted">
                    {dish.description && dish.description.length > 100
                      ? `${dish.description.substring(0, 100)}...`
                      : dish.description}
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      <Pagination
        currentPage={page}
        totalItems={totalItems}
        itemsPerPage={30}
        onPageChange={setPage}
      />
    </div>
  );
};

export default DishList;

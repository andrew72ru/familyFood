import React, { useEffect, useState } from 'react';
import { Table, Button, Spinner, Alert, Container } from 'react-bootstrap';
import { Dish } from '../types/Dish';
import { fetchApi } from '../api';
import Pagination from './Pagination';
import ErrorDisplay from './ErrorDisplay';

const AdminDishList: React.FC = () => {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [error, setError] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 30;

  const fetchDishes = React.useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchApi(`/api/dishes?page=${page}`);
      const fetchedDishes = data['hydra:member'] || data['member'] || [];
      setDishes(fetchedDishes);
      setTotalItems(data['hydra:totalItems'] || data['totalItems'] || 0);
      setLoading(false);
    } catch (err: any) {
      setError(err);
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchDishes();
  }, [fetchDishes]);

  const handleDelete = async (dish: Dish) => {
    const dishId = dish['@id'] || `/api/dishes/${dish.id}`;

    try {
      await fetchApi(dishId, { method: 'DELETE' });
      // Remove the dish from the state if deletion was successful
      setDishes((prevDishes) => prevDishes.filter((d) => d.id !== dish.id));
      setTotalItems((prevTotal) => prevTotal - 1);

      // If we deleted the last item on the page and it's not the first page, go back
      if (dishes.length === 1 && page > 1) {
        setPage(page - 1);
      }
    } catch (err: any) {
      setError(err);
    }
  };

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
    return <ErrorDisplay error={error} onClose={() => setError(null)} />;
  }

  return (
    <Container className="mb-5">
      <h1 className="mb-4">Admin: Dishes</h1>

      {dishes.length === 0 ? (
        <Alert variant="info">No dishes found.</Alert>
      ) : (
        <>
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>Name</th>
                <th style={{ width: '150px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {dishes.map((dish) => (
                <tr key={dish.id || dish['@id']}>
                  <td>{dish.name}</td>
                  <td>
                    <Button variant="danger" size="sm" onClick={() => handleDelete(dish)}>
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>

          <Pagination currentPage={page} totalItems={totalItems} itemsPerPage={itemsPerPage} onPageChange={setPage} />
        </>
      )}
    </Container>
  );
};

export default AdminDishList;

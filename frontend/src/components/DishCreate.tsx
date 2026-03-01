import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Container } from 'react-bootstrap';
import DishForm from '../components/DishForm';

const DishCreate: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Create New Dish</h1>
      </div>
      <Card className="shadow-sm">
        <Card.Body>
          <DishForm onSave={() => navigate('/dishes')} onCancel={() => navigate('/dishes')} />
        </Card.Body>
      </Card>
    </Container>
  );
};

export default DishCreate;

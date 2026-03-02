import React, { useEffect, useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import {
  Button,
  Card,
  Spinner,
  Alert,
  Row,
  Col,
  Form,
  InputGroup,
  Badge,
  Collapse,
} from 'react-bootstrap';
import { Dish, Tag } from '../types/Dish';
import { fetchApi } from '../api';
import Pagination from './Pagination';
import ErrorDisplay from './ErrorDisplay';

const DishList: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [error, setError] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const searchTerm = searchParams.get('search') || '';
  const selectedTags = React.useMemo(() => searchParams.getAll('tags[]'), [searchParams]);
  const [searchInput, setSearchInput] = useState(searchTerm);
  const [isTagsOpen, setIsTagsOpen] = useState(false);

  const navigate = useNavigate();

  const fetchAvailableTags = async () => {
    try {
      const data = await fetchApi('/api/tags');
      setAvailableTags(data['hydra:member'] || data['member'] || []);
    } catch (err) {
      console.error('Failed to fetch tags', err);
    }
  };

  const fetchDishes = React.useCallback(async () => {
    try {
      setLoading(true);
      let url = `/api/dishes?page=${page}`;
      if (searchTerm) {
        url += `&search[name]=${encodeURIComponent(searchTerm)}`;
      }
      if (selectedTags.length > 0) {
        selectedTags.forEach((tagIri) => {
          url += `&tags[]=${encodeURIComponent(tagIri)}`;
        });
      }
      const data = await fetchApi(url);
      const fetchedDishes = data['hydra:member'] || data['member'] || [];
      setDishes(fetchedDishes);
      setTotalItems(data['hydra:totalItems'] || data['totalItems'] || 0);
    } catch (err: any) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [page, searchTerm, selectedTags]);

  useEffect(() => {
    fetchAvailableTags();
  }, []);

  useEffect(() => {
    setSearchInput(searchTerm);
  }, [searchTerm]);

  useEffect(() => {
    fetchDishes();
  }, [fetchDishes]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const nextParams = new URLSearchParams();
    if (searchInput) nextParams.set('search', searchInput);
    selectedTags.forEach((tag) => nextParams.append('tags[]', tag));

    setSearchParams(nextParams);
    setPage(1);
  };

  const handleTagToggle = (tagIri: string) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('page'); // Reset page when filtering

    const currentTags = nextParams.getAll('tags[]');
    if (currentTags.includes(tagIri)) {
      // Remove tag
      const remainingTags = currentTags.filter((t) => t !== tagIri);
      nextParams.delete('tags[]');
      remainingTags.forEach((t) => nextParams.append('tags[]', t));
    } else {
      // Add tag
      nextParams.append('tags[]', tagIri);
    }

    setSearchParams(nextParams);
    setPage(1);
  };

  const handleReset = () => {
    setSearchInput('');
    setSearchParams({});
    setPage(1);
  };

  if (loading && dishes.length === 0) {
    return (
      <div className="text-center mt-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading dishes...</span>
        </Spinner>
      </div>
    );
  }

  if (error) {
    return <ErrorDisplay error={error} />;
  }

  return (
    <div className="mb-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Dishes</h1>
        <Button variant="primary" onClick={() => navigate('/dishes/new')}>
          Add New Dish
        </Button>
      </div>

      <div className="mb-4">
        <Form onSubmit={handleSearch}>
          <InputGroup>
            <Form.Control
              type="text"
              placeholder="Search dishes by name..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            <Button variant="outline-secondary" type="submit">
              Search
            </Button>
            <Button variant="outline-danger" type="button" onClick={handleReset}>
              Reset
            </Button>
          </InputGroup>
        </Form>
      </div>

      <div className="mb-4">
        <Button
          variant="link"
          onClick={() => setIsTagsOpen(!isTagsOpen)}
          aria-controls="tags-collapse"
          aria-expanded={isTagsOpen}
          className="p-0 mb-2 text-decoration-none"
        >
          {isTagsOpen ? 'Hide tags' : 'Show tags'}
        </Button>
        <Collapse in={isTagsOpen}>
          <div id="tags-collapse">
            <div className="d-flex flex-wrap gap-2">
              {availableTags.map((tag) => {
                const tagIri = tag['@id'] || `/api/tags/${tag.id}`;
                const isActive = selectedTags.includes(tagIri);
                return (
                  <Button
                    key={tagIri}
                    variant={isActive ? 'primary' : 'outline-primary'}
                    size="sm"
                    onClick={() => handleTagToggle(tagIri)}
                  >
                    {tag.name}
                  </Button>
                );
              })}
            </div>
          </div>
        </Collapse>
      </div>

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
                  {dish.tags && dish.tags.length > 0 && (
                    <div className="mt-2">
                      {(dish.tags as Tag[]).map((tag, idx) => (
                        <Badge
                          key={idx}
                          bg="info"
                          pill
                          className="me-1"
                          style={{ fontSize: '0.7rem' }}
                        >
                          {tag.name}
                        </Badge>
                      ))}
                    </div>
                  )}
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

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button, Form, Table, InputGroup } from 'react-bootstrap';
import { Tag } from '../types/Dish';
import { fetchApi } from '../api';
import Pagination from './Pagination';
import ErrorDisplay from './ErrorDisplay';

const TagManager: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [tags, setTags] = useState<Tag[]>([]);
  const [newTagName, setNewTagName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [error, setError] = useState<any | null>(null);
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const searchTerm = searchParams.get('search') || '';
  const [searchInput, setSearchInput] = useState(searchTerm);

  const fetchTags = React.useCallback(async () => {
    try {
      let url = `/api/tags?page=${page}`;
      if (searchTerm) {
        url += `&search[name]=${encodeURIComponent(searchTerm)}`;
      }
      const data = await fetchApi(url);
      setTags(data['hydra:member'] || data['member'] || []);
      setTotalItems(data['hydra:totalItems'] || data['totalItems'] || 0);
    } catch (err: any) {
      setError(err);
    }
  }, [page, searchTerm]);

  useEffect(() => {
    setSearchInput(searchTerm);
  }, [searchTerm]);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput) {
      setSearchParams({ search: searchInput });
    } else {
      setSearchParams({});
    }
    setPage(1);
  };

  const handleReset = () => {
    setSearchInput('');
    setSearchParams({});
    setPage(1);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetchApi('/api/tags', {
        method: 'POST',
        body: JSON.stringify({ name: newTagName }),
      });
      setNewTagName('');
      fetchTags();
    } catch (err: any) {
      setError(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure?')) return;
    try {
      await fetchApi(id, { method: 'DELETE' });
      fetchTags();
    } catch (err: any) {
      setError(err);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    try {
      await fetchApi(editingId, {
        method: 'PATCH',
        body: JSON.stringify({ name: editingName }),
      });
      setEditingId(null);
      fetchTags();
    } catch (err: any) {
      setError(err);
    }
  };

  return (
    <div className="mb-5">
      <h3>Tags</h3>
      <ErrorDisplay error={error} onClose={() => setError(null)} className="mb-4" />

      <div className="mb-4">
        <Form onSubmit={handleSearch}>
          <InputGroup>
            <Form.Control
              type="text"
              placeholder="Search tags by name..."
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

      <Form onSubmit={handleCreate} className="mb-4">
        <InputGroup>
          <Form.Control
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            placeholder="New tag name"
            required
          />
          <Button variant="success" type="submit">
            Add Tag
          </Button>
        </InputGroup>
      </Form>

      <Table striped bordered hover responsive>
        <thead className="table-dark">
          <tr>
            <th>Name</th>
            <th style={{ width: '200px' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {tags.map((tag) => (
            <tr key={tag['@id']}>
              <td>
                {editingId === tag['@id'] ? (
                  <Form.Control
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    required
                  />
                ) : (
                  tag.name
                )}
              </td>
              <td>
                {editingId === tag['@id'] ? (
                  <>
                    <Button
                      variant="outline-success"
                      size="sm"
                      className="me-2"
                      onClick={handleUpdate}
                    >
                      Save
                    </Button>
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      onClick={() => setEditingId(null)}
                    >
                      Cancel
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="outline-primary"
                      size="sm"
                      className="me-2"
                      onClick={() => {
                        setEditingId(tag['@id']!);
                        setEditingName(tag.name!);
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => handleDelete(tag['@id']!)}
                    >
                      Delete
                    </Button>
                  </>
                )}
              </td>
            </tr>
          ))}
          {tags.length === 0 && (
            <tr>
              <td colSpan={2} className="text-center text-muted">
                No tags found.
              </td>
            </tr>
          )}
        </tbody>
      </Table>

      <Pagination
        currentPage={page}
        totalItems={totalItems}
        itemsPerPage={30}
        onPageChange={setPage}
      />
    </div>
  );
};

export default TagManager;

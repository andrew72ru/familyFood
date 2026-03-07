import React, { useEffect, useRef, useState } from 'react';
import { Button, Form, ListGroup, Accordion } from 'react-bootstrap';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import { useTranslation } from 'react-i18next';
import { RecipeComment } from '../types/Dish';
import { fetchApi } from '../api';

interface RecipeCommentsProps {
  dishId: string;
  recipeComments: RecipeComment[];
  onCommentChange: () => void;
  setError: (error: any) => void;
}

const RecipeComments: React.FC<RecipeCommentsProps> = ({ dishId, recipeComments, onCommentChange, setError }) => {
  const { t } = useTranslation();
  const [newComment, setNewComment] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const commentRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (commentRef.current && (newComment || editingCommentText)) {
      commentRef.current.style.height = 'auto';
      const newHeight = Math.max(commentRef.current.scrollHeight + 50, 100);
      commentRef.current.style.height = `${newHeight}px`;
    }
  }, [newComment, editingCommentText]);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !dishId) return;

    try {
      setIsSubmittingComment(true);
      await fetchApi('/api/recipe_comments', {
        method: 'POST',
        body: JSON.stringify({
          text: newComment,
          dish: dishId,
        }),
      });
      setNewComment('');
      onCommentChange();
    } catch (err: any) {
      setError(err);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleEditClick = (comment: RecipeComment) => {
    if (comment['@id']) {
      setEditingCommentId(comment['@id']);
      setEditingCommentText(comment.text || '');
    }
  };

  const handleSaveComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCommentId || !editingCommentText.trim()) return;

    try {
      setIsSubmittingComment(true);
      await fetchApi(editingCommentId, {
        method: 'PATCH',
        body: JSON.stringify({
          text: editingCommentText,
        }),
      });
      setEditingCommentId(null);
      setEditingCommentText('');
      onCommentChange();
    } catch (err: any) {
      setError(err);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditingCommentText('');
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm(t('Are you sure you want to delete this comment?'))) return;

    try {
      await fetchApi(commentId, { method: 'DELETE' });
      onCommentChange();
    } catch (err: any) {
      setError(err);
    }
  };

  return (
    <Accordion className="mt-4">
      <Accordion.Item eventKey="comments">
        <Accordion.Header>
          {t('Comments')} ({recipeComments.length})
        </Accordion.Header>
        <Accordion.Body>
          {recipeComments.length > 0 ? (
            <ListGroup variant="flush" className="mb-3">
              {recipeComments.map((comment: RecipeComment) => (
                <ListGroup.Item key={comment['@id']} className="px-0 py-3 border-bottom">
                  {editingCommentId === comment['@id'] ? (
                    <Form onSubmit={handleSaveComment}>
                      <Form.Group className="mb-2">
                        <Form.Control
                          as="textarea"
                          rows={3}
                          value={editingCommentText}
                          onChange={(e) => setEditingCommentText(e.target.value)}
                          required
                          style={{ overflowY: 'auto' }}
                          ref={commentRef}
                        />
                      </Form.Group>
                      <div className="d-flex justify-content-end gap-2">
                        <Button variant="outline-secondary" size="sm" onClick={handleCancelEdit}>
                          {t('Cancel')}
                        </Button>
                        <Button
                          variant="primary"
                          type="submit"
                          size="sm"
                          disabled={isSubmittingComment || !editingCommentText.trim()}
                        >
                          {isSubmittingComment ? t('Saving...') : t('Save')}
                        </Button>
                      </div>
                    </Form>
                  ) : (
                    <div className="d-flex justify-content-between align-items-start">
                      <div className="markdown-body small flex-grow-1">
                        <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>{comment.text || ''}</ReactMarkdown>
                        {comment.createdAt && (
                          <div className="text-muted mt-1" style={{ fontSize: '0.75rem' }}>
                            {new Date(comment.createdAt).toLocaleString()}
                          </div>
                        )}
                      </div>
                      <div className="ms-2 d-flex gap-2">
                        <Button variant="outline-primary" size="sm" onClick={() => handleEditClick(comment)}>
                          <i className="bi bi-pencil"></i>
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => comment['@id'] && handleDeleteComment(comment['@id'])}
                        >
                          <i className="bi bi-trash"></i>
                        </Button>
                      </div>
                    </div>
                  )}
                </ListGroup.Item>
              ))}
            </ListGroup>
          ) : (
            <p className="text-muted">{t('No comments yet')}</p>
          )}

          <Form onSubmit={handleAddComment} className="mt-3">
            <Form.Group className="mb-2">
              <Form.Control
                as="textarea"
                rows={3}
                placeholder={t('Add a comment')}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                required
                style={{ overflowY: 'auto' }}
                ref={commentRef}
              />
            </Form.Group>
            <div className="d-flex justify-content-end">
              <Button variant="primary" type="submit" size="sm" disabled={isSubmittingComment || !newComment.trim()}>
                {isSubmittingComment ? t('Sending...') : t('Add Comment')}
              </Button>
            </div>
          </Form>
        </Accordion.Body>
      </Accordion.Item>
    </Accordion>
  );
};

export default RecipeComments;

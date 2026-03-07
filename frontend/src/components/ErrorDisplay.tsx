import React from 'react';
import { Alert } from 'react-bootstrap';
import { ApiError } from '../api';

interface ErrorDisplayProps {
  error: any;
  onClose?: () => void;
  className?: string;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ error, onClose, className }) => {
  if (!error) return null;

  const isDev = process.env.NODE_ENV === 'development';
  const message = typeof error === 'string' ? error : error.message || 'An unknown error occurred';

  return (
    <Alert variant="danger" dismissible={!!onClose} onClose={onClose} className={className || 'mt-3'}>
      <div className="fw-bold">{message}</div>
      {isDev && error instanceof ApiError && (
        <div className="mt-2 pt-2 border-top">
          <small>
            <div>
              <strong>Status:</strong> {error.status} {error.statusText}
            </div>
            {error.data && (
              <div className="mt-1">
                <strong>Details:</strong>
                <pre
                  className="mt-1 p-2 bg-light border rounded"
                  style={{ maxHeight: '200px', overflow: 'auto', whiteSpace: 'pre-wrap' }}
                >
                  {JSON.stringify(error.data, null, 2)}
                </pre>
              </div>
            )}
          </small>
        </div>
      )}
      {isDev && !(error instanceof ApiError) && typeof error === 'object' && (
        <div className="mt-2 pt-2 border-top">
          <small>
            <pre
              className="mt-1 p-2 bg-light border rounded"
              style={{ maxHeight: '200px', overflow: 'auto', whiteSpace: 'pre-wrap' }}
            >
              {JSON.stringify(error, null, 2)}
            </pre>
          </small>
        </div>
      )}
    </Alert>
  );
};

export default ErrorDisplay;

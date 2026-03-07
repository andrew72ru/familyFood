import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders app name', () => {
  render(<App />);
  const linkElements = screen.getAllByText(/Family Food/i);
  expect(linkElements.length).toBeGreaterThan(0);
});

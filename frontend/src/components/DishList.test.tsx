import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import '../i18n';
import { fetchApi } from '../api';
import DishList from './DishList';

jest.mock('../api', () => ({
  fetchApi: jest.fn(),
}));

const mockedFetchApi = fetchApi as jest.MockedFunction<typeof fetchApi>;

afterEach(() => {
  jest.restoreAllMocks();
  mockedFetchApi.mockReset();
});

test('chooses a random dish from all results matching the selected tag', async () => {
  jest.spyOn(Math, 'random').mockReturnValue(0.9);
  mockedFetchApi.mockImplementation(async (path: string) => {
    if (path === '/api/tags') {
      return { member: [{ '@id': '/api/tags/1', id: 1, name: 'Soup' }] };
    }

    const url = new URL(path, 'https://family-food.test');
    if (url.searchParams.get('itemsPerPage') === '1') {
      return { member: [{ '@id': '/api/dishes/42', id: 42, name: 'Random soup' }] };
    }

    return {
      member: [{ '@id': '/api/dishes/1', id: 1, name: 'First soup' }],
      totalItems: 237,
    };
  });

  render(
    <MemoryRouter initialEntries={['/?tags[]=/api/tags/1']}>
      <Routes>
        <Route path="/" element={<DishList />} />
        <Route path="/dishes/:id" element={<div>Random dish opened</div>} />
      </Routes>
    </MemoryRouter>,
  );

  const randomButton = await screen.findByRole('button', { name: 'Random dish' });
  await waitFor(() => expect(randomButton).toBeEnabled());
  fireEvent.click(randomButton);

  await screen.findByText('Random dish opened');
  expect(mockedFetchApi).toHaveBeenCalledWith('/api/dishes?page=214&itemsPerPage=1&tags%5B%5D=%2Fapi%2Ftags%2F1');
});

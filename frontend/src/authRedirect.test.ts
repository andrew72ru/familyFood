import { buildLoginUrl, getSafeReturnPath } from './authRedirect';

describe('authentication redirects', () => {
  test('builds a login URL that preserves path, query, and hash', () => {
    expect(buildLoginUrl('/dishes/42?tab=recipe#ingredients')).toBe(
      '/login?next=%2Fdishes%2F42%3Ftab%3Drecipe%23ingredients',
    );
  });

  test.each([
    ['/dishes/42', '/dishes/42'],
    ['/dishes?search=soup#results', '/dishes?search=soup#results'],
    [null, '/'],
    ['', '/'],
    ['https://example.com/dishes/42', '/'],
    ['//example.com/dishes/42', '/'],
    ['/login', '/'],
    ['/login?next=/dishes/42', '/'],
  ])('converts %p into the safe return path %p', (returnTo, expected) => {
    expect(getSafeReturnPath(returnTo)).toBe(expected);
  });
});

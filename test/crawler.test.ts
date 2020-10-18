import { main } from '../src/crawler';

describe('crawler', () => {
  test('basic list of domains', async () => {
    const domains = [
      "https://angular.io/",
      "https://vuejs.org/",
      "https://reactjs.org",
      "https://airbnb.com",
      "https://webpack.js.org",
      "https://facebook.com",
      "https://emberjs.com",
    ];
    const results = await main(domains);
    expect(results).toMatchSnapshot();
  })
})
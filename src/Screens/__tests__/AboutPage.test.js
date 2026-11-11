import React from 'react';
import { render } from '@testing-library/react-native';

import AboutPage from '../AboutPage';

describe('<AboutPage />', () => {
  beforeEach(() => {
    jest.spyOn(Date.prototype, 'getFullYear').mockReturnValue(2024);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders correctly', () => {
    const { toJSON } = render(<AboutPage />);
    expect(toJSON()).toMatchSnapshot();
  });
});

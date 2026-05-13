import React from 'react';
import { render } from '@testing-library/react';

import { FileUploadButton } from '../FileUploadButton';

describe('FileUploadButton', () => {
  const props = {
    label: 'Upload',
    onChange: jest.fn(),
  };

  it('supports multiple file selection', () => {
    const { container } = render(<FileUploadButton {...props} multiple />);

    expect(container.querySelector('input')).toHaveAttribute('multiple');
  });
});

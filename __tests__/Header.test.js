import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import Header from '../src/components/Header';

describe('Header', () => {
  it('renders the title and menu button', () => {
    const onMenuPress = jest.fn();
    const { getByText, getByLabelText } = render(
      <Header title="Test Title" onMenuPress={onMenuPress} />
    );
    expect(getByText('Test Title')).toBeTruthy();
    const menuButton = getByLabelText('Open menu');
    expect(menuButton).toBeTruthy();
    fireEvent.press(menuButton);
    expect(onMenuPress).toHaveBeenCalled();
  });
});

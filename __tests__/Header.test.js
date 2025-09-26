/**
 * Header.test.js - Unit tests for the Header component
 * 
 * This test suite validates the Header component functionality including:
 * - Proper rendering of title text
 * - Menu button presence and interaction
 * - Accessibility features
 * - Event handler execution
 * 
 * Test Framework: Jest + React Native Testing Library
 * 
 * Coverage:
 * - Component rendering validation
 * - User interaction testing
 * - Accessibility compliance
 * - Prop handling verification
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import Header from '../src/components/Header';

describe('Header', () => {
  /**
   * Test Case: Header Component Rendering and Interaction
   * 
   * Validates:
   * - Title text is displayed correctly
   * - Menu button is present and accessible
   * - Menu button press triggers callback function
   * - Accessibility labels are properly set
   */
  it('renders the title and menu button', () => {
    const onMenuPress = jest.fn();
    const { getByText, getByLabelText } = render(
      <Header title="Test Title" onMenuPress={onMenuPress} />
    );
    
    // Verify title text is rendered
    expect(getByText('Test Title')).toBeTruthy();
    
    // Verify menu button is accessible and clickable
    const menuButton = getByLabelText('Open menu');
    expect(menuButton).toBeTruthy();
    
    // Test menu button interaction
    fireEvent.press(menuButton);
    expect(onMenuPress).toHaveBeenCalled();
  });
});

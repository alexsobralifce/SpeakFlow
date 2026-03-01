import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { MessageBubble } from '../src/MessageBubble';
import { FeedbackChip } from '../src/FeedbackChip';

describe('UI Components', () => {

  describe('MessageBubble', () => {
    it('renders user message correctly', () => {
      const { getByText, getByRole } = render(<MessageBubble role="user" content="User message" />);
      expect(getByRole('article')).toBeInTheDocument();
      expect(getByText('User message')).toBeInTheDocument();
    });

    it('renders assistant message correctly', () => {
      const { getByText } = render(<MessageBubble role="assistant" content="AI message" />);
      expect(getByText('AI message')).toBeInTheDocument();
    });

    it('renders loading state (skeleton)', () => {
      const { container } = render(<MessageBubble role="assistant" isLoading />);
      // Assuming bounce animation class is used for skeleton dots
      expect(container.querySelector('.animate-bounce')).toBeInTheDocument();
    });

    it('renders error state', () => {
      const { getByText, container } = render(<MessageBubble role="user" content="Error!" isError />);
      expect(getByText('Error!')).toBeInTheDocument();
      expect(container.querySelector('.bg-semantic-error')).toBeInTheDocument();
    });
  });

  describe('FeedbackChip', () => {
    it('renders correction chip and handles click', () => {
      const handleClick = jest.fn();
      const { getByText, getByRole } = render(
        <FeedbackChip variant="correction" label="Was -> Were" onClick={handleClick} />
      );

      const btn = getByRole('note'); // the component role
      expect(getByText('Was -> Were')).toBeInTheDocument();
      expect(btn.className).toContain('text-semantic-error');

      fireEvent.click(btn);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('renders new-word chip', () => {
      const { getByText, getByRole } = render(
        <FeedbackChip variant="new-word" label="Stunning" />
      );
      expect(getByText('Stunning')).toBeInTheDocument();
      expect(getByRole('note').className).toContain('text-semantic-info');
    });
  });

});

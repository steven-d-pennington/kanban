import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { AgentActionButton } from './agent-action-button';

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Pause: () => <div data-testid="pause-icon">Pause</div>,
  Play: () => <div data-testid="play-icon">Play</div>,
  Loader2: () => <div data-testid="loader-icon">Loading</div>,
}));

describe('AgentActionButton', () => {
  const mockOnClick = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('pause button rendering', () => {
    it('should render pause button with correct styling', () => {
      // Arrange & Act
      render(
        <AgentActionButton
          action="pause"
          onClick={mockOnClick}
        />
      );

      // Assert
      const button = screen.getByRole('button');
      const pauseIcon = screen.getByTestId('pause-icon');

      expect(button).toBeInTheDocument();
      expect(pauseIcon).toBeInTheDocument();
      expect(button).toHaveClass('bg-yellow-100', 'text-yellow-700', 'hover:bg-yellow-200');
    });

    it('should have correct accessibility attributes for pause button', () => {
      // Arrange & Act
      render(
        <AgentActionButton
          action="pause"
          onClick={mockOnClick}
        />
      );

      // Assert
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Pause agent');
    });
  });

  describe('resume button rendering', () => {
    it('should render resume button with correct styling', () => {
      // Arrange & Act
      render(
        <AgentActionButton
          action="resume"
          onClick={mockOnClick}
        />
      );

      // Assert
      const button = screen.getByRole('button');
      const playIcon = screen.getByTestId('play-icon');

      expect(button).toBeInTheDocument();
      expect(playIcon).toBeInTheDocument();
      expect(button).toHaveClass('bg-green-100', 'text-green-700', 'hover:bg-green-200');
    });

    it('should have correct accessibility attributes for resume button', () => {
      // Arrange & Act
      render(
        <AgentActionButton
          action="resume"
          onClick={mockOnClick}
        />
      );

      // Assert
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Resume agent');
    });
  });

  describe('click handler functionality', () => {
    it('should call onClick handler when pause button is clicked', () => {
      // Arrange
      render(
        <AgentActionButton
          action="pause"
          onClick={mockOnClick}
        />
      );

      // Act
      const button = screen.getByRole('button');
      fireEvent.click(button);

      // Assert
      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it('should call onClick handler when resume button is clicked', () => {
      // Arrange
      render(
        <AgentActionButton
          action="resume"
          onClick={mockOnClick}
        />
      );

      // Act
      const button = screen.getByRole('button');
      fireEvent.click(button);

      // Assert
      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it('should not call onClick handler when button is disabled', () => {
      // Arrange
      render(
        <AgentActionButton
          action="pause"
          onClick={mockOnClick}
          disabled={true}
        />
      );

      // Act
      const button = screen.getByRole('button');
      fireEvent.click(button);

      // Assert
      expect(mockOnClick).not.toHaveBeenCalled();
    });

    it('should not call onClick handler when button is loading', () => {
      // Arrange
      render(
        <AgentActionButton
          action="pause"
          onClick={mockOnClick}
          loading={true}
        />
      );

      // Act
      const button = screen.getByRole('button');
      fireEvent.click(button);

      // Assert
      expect(mockOnClick).not.toHaveBeenCalled();
    });
  });

  describe('disabled state', () => {
    it('should be disabled when loading prop is true', () => {
      // Arrange & Act
      render(
        <AgentActionButton
          action="pause"
          onClick={mockOnClick}
          loading={true}
        />
      );

      // Assert
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('should be disabled when disabled prop is true', () => {
      // Arrange & Act
      render(
        <AgentActionButton
          action="pause"
          onClick={mockOnClick}
          disabled={true}
        />
      );

      // Assert
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('should be disabled when both loading and disabled are true', () => {
      // Arrange & Act
      render(
        <AgentActionButton
          action="pause"
          onClick={mockOnClick}
          loading={true}
          disabled={true}
        />
      );

      // Assert
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('should not be disabled when neither loading nor disabled are true', () => {
      // Arrange & Act
      render(
        <AgentActionButton
          action="pause"
          onClick={mockOnClick}
        />
      );

      // Assert
      const button = screen.getByRole('button');
      expect(button).not.toBeDisabled();
    });

    it('should have disabled styling when disabled', () => {
      // Arrange & Act
      render(
        <AgentActionButton
          action="pause"
          onClick={mockOnClick}
          disabled={true}
        />
      );

      // Assert
      const button = screen.getByRole('button');
      expect(button).toHaveClass('opacity-50', 'cursor-not-allowed');
    });
  });

  describe('loading state', () => {
    it('should show loading state properly for pause button', () => {
      // Arrange & Act
      render(
        <AgentActionButton
          action="pause"
          onClick={mockOnClick}
          loading={true}
        />
      );

      // Assert
      const loaderIcon = screen.getByTestId('loader-icon');
      const pauseIcon = screen.queryByTestId('pause-icon');

      expect(loaderIcon).toBeInTheDocument();
      expect(pauseIcon).not.toBeInTheDocument();
    });

    it('should show loading state properly for resume button', () => {
      // Arrange & Act
      render(
        <AgentActionButton
          action="resume"
          onClick={mockOnClick}
          loading={true}
        />
      );

      // Assert
      const loaderIcon = screen.getByTestId('loader-icon');
      const playIcon = screen.queryByTestId('play-icon');

      expect(loaderIcon).toBeInTheDocument();
      expect(playIcon).not.toBeInTheDocument();
    });

    it('should have loading styling when loading', () => {
      // Arrange & Act
      render(
        <AgentActionButton
          action="pause"
          onClick={mockOnClick}
          loading={true}
        />
      );

      // Assert
      const button = screen.getByRole('button');
      expect(button).toHaveClass('cursor-not-allowed');
    });

    it('should show correct icon when not loading', () => {
      // Arrange & Act
      render(
        <AgentActionButton
          action="pause"
          onClick={mockOnClick}
          loading={false}
        />
      );

      // Assert
      const pauseIcon = screen.getByTestId('pause-icon');
      const loaderIcon = screen.queryByTestId('loader-icon');

      expect(pauseIcon).toBeInTheDocument();
      expect(loaderIcon).not.toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('should handle undefined props gracefully', () => {
      // Arrange & Act
      const { container } = render(
        <AgentActionButton
          action="pause"
          onClick={mockOnClick}
          disabled={undefined}
          loading={undefined}
        />
      );

      // Assert
      const button = screen.getByRole('button');
      expect(button).not.toBeDisabled();
      expect(container).toBeInTheDocument();
    });

    it('should maintain button type attribute', () => {
      // Arrange & Act
      render(
        <AgentActionButton
          action="pause"
          onClick={mockOnClick}
        />
      );

      // Assert
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'button');
    });

    it('should handle rapid clicks properly when not disabled', () => {
      // Arrange
      render(
        <AgentActionButton
          action="pause"
          onClick={mockOnClick}
        />
      );

      // Act
      const button = screen.getByRole('button');
      fireEvent.click(button);
      fireEvent.click(button);
      fireEvent.click(button);

      // Assert
      expect(mockOnClick).toHaveBeenCalledTimes(3);
    });

    it('should maintain styling consistency across different states', () => {
      // Arrange & Act
      const { rerender } = render(
        <AgentActionButton
          action="pause"
          onClick={mockOnClick}
        />
      );

      const button = screen.getByRole('button');
      expect(button).toHaveClass('inline-flex', 'items-center', 'justify-center');

      // Act - rerender with different props
      rerender(
        <AgentActionButton
          action="resume"
          onClick={mockOnClick}
          loading={true}
        />
      );

      // Assert
      expect(button).toHaveClass('inline-flex', 'items-center', 'justify-center');
    });
  });
});
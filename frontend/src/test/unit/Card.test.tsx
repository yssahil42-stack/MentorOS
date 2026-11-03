import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '../../components/ui/Card';

describe('Card', () => {
  it('renders card with children', () => {
    render(<Card>Card content</Card>);
    expect(screen.getByText('Card content')).toBeInTheDocument();
  });

  it('applies default classes', () => {
    render(<Card>Content</Card>);
    const card = screen.getByText('Content').parentElement;
    expect(card).toHaveClass('bg-bg-surface');
    expect(card).toHaveClass('border-border-base');
    expect(card).toHaveClass('rounded-2xl');
  });

  it('applies variant classes', () => {
    render(<Card variant="elevated">Elevated</Card>);
    const card = screen.getByText('Elevated').parentElement;
    expect(card).toHaveClass('shadow-card');
  });

  it('renders CardHeader with title and description', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Card Title</CardTitle>
          <CardDescription>Card description</CardDescription>
        </CardHeader>
      </Card>
    );
    expect(screen.getByText('Card Title')).toBeInTheDocument();
    expect(screen.getByText('Card description')).toBeInTheDocument();
  });

  it('renders CardContent', () => {
    render(
      <Card>
        <CardContent>Card content area</CardContent>
      </Card>
    );
    expect(screen.getByText('Card content area')).toBeInTheDocument();
  });

  it('renders CardFooter', () => {
    render(
      <Card>
        <CardFooter>Footer actions</CardFooter>
      </Card>
    );
    expect(screen.getByText('Footer actions')).toBeInTheDocument();
  });

  it('applies interactive variant with hover effects', () => {
    render(<Card variant="interactive">Interactive</Card>);
    const card = screen.getByText('Interactive').parentElement;
    expect(card).toHaveClass('cursor-pointer');
    expect(card).toHaveClass('transition-all');
  });
});

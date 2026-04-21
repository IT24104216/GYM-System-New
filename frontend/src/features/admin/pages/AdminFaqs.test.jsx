import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import AdminFaqs from './AdminFaqs.jsx';

vi.mock('@/shared/components/faq/FaqManagerPage', () => ({
  default: ({ role, title, subtitle }) => (
    <div>
      <h1>{title}</h1>
      <p>{subtitle}</p>
      <span data-testid="faq-role">{role}</span>
    </div>
  ),
}));

describe('AdminFaqs', () => {
  it('renders FAQ manager with admin props', () => {
    render(<AdminFaqs />);

    expect(screen.getByText('Admin FAQ Manager')).toBeInTheDocument();
    expect(screen.getByText(/create, edit, and delete faqs shown to all users/i)).toBeInTheDocument();
    expect(screen.getByTestId('faq-role')).toHaveTextContent('admin');
  });
});


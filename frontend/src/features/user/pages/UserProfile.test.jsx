import { render, screen } from '@testing-library/react';
import UserProfile from './UserProfile.jsx';

describe('UserProfile', () => {
  it('renders profile heading and helper text', () => {
    render(<UserProfile />);

    expect(screen.getByText(/my profile/i)).toBeInTheDocument();
    expect(screen.getByText(/view and update your personal information/i)).toBeInTheDocument();
  });
});

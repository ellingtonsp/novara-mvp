import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import NovaraLanding from '../components/NovaraLanding';

// Mock the AuthContext
vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    login: vi.fn(),
    logout: vi.fn(),
    isLoading: false,
  }),
}));

describe('NovaraLanding', () => {
  it('renders onboarding form', () => {
    render(<NovaraLanding />);
    
    // Check for main form elements
    expect(screen.getByText(/Welcome to Novara/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Nickname/)).toBeInTheDocument();
    expect(screen.getByText(/What stage of IVF are you in?/)).toBeInTheDocument();
    expect(screen.getByText(/What's your primary need?/)).toBeInTheDocument();
  });

  it('displays all cycle stage options', () => {
    render(<NovaraLanding />);
    
    const cycleStageOptions = [
      'Just considering IVF',
      'Preparing for IVF',
      'In stimulation phase',
      'Around retrieval',
      'Transfer stage',
      'Two-week wait',
      'Pregnant',
      'Between cycles'
    ];
    
    cycleStageOptions.forEach(option => {
      expect(screen.getByText(option)).toBeInTheDocument();
    });
  });

  it('displays all primary need options', () => {
    render(<NovaraLanding />);
    
    const primaryNeedOptions = [
      'Emotional support',
      'Medication guidance',
      'Financial planning',
      'Procedure information',
      'Community connection'
    ];
    
    primaryNeedOptions.forEach(option => {
      expect(screen.getByText(option)).toBeInTheDocument();
    });
  });
}); 
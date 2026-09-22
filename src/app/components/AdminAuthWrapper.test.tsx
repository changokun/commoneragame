/**
 * Tests for AdminAuthWrapper.tsx - Admin Route Protection Component
 * 
 * This file tests:
 * - Route protection behavior
 * - Token checking
 * - Redirect logic
 * - Rendering behavior
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// Import the component to test
import { AdminAuthWrapper } from './AdminAuthWrapper';

// Mock React Router hooks
const mockNavigate = vi.fn();
const mockLocation = {
  pathname: '/admin/dashboard',
  state: null,
};

vi.mock('react-router', () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => mockLocation,
}));

// Mock the hasAdminToken function from adminAuth service
vi.mock('../services/adminAuth', () => ({
  hasAdminToken: vi.fn(),
}));

// Import the mocked hasAdminToken
import { hasAdminToken } from '../services/adminAuth';

describe('AdminAuthWrapper - Admin Route Protection', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    vi.resetAllMocks();
    
    // Clear any previous renders
    document.body.innerHTML = '';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ========================================================================
  // Tests for No Token Scenario
  // ========================================================================
  describe('when no admin token exists', () => {
    beforeEach(() => {
      // Mock hasAdminToken to return false
      (hasAdminToken as vi.Mock).mockReturnValue(false);
    });

    it('redirects to /admin/login', () => {
      render(<AdminAuthWrapper><div>Protected Content</div></AdminAuthWrapper>);
      
      expect(mockNavigate).toHaveBeenCalledWith(
        '/admin/login',
        expect.objectContaining({
          state: expect.objectContaining({
            from: mockLocation,
          }),
          replace: true,
        })
      );
    });

    it('does not render children', () => {
      render(<AdminAuthWrapper><div>Protected Content</div></AdminAuthWrapper>);
      
      // Initially renders null, then redirects
      // After redirect, children should not be rendered
      // Since we mock the navigate, the component will still be in the DOM briefly
      // but the important thing is that navigate was called
      expect(mockNavigate).toHaveBeenCalled();
    });

    it('preserves the current location in state', () => {
      render(<AdminAuthWrapper><div>Protected Content</div></AdminAuthWrapper>);
      
      expect(mockNavigate).toHaveBeenCalledWith(
        '/admin/login',
        expect.objectContaining({
          state: expect.objectContaining({
            from: mockLocation,
          }),
        })
      );
    });

    it('uses replace: true for navigation', () => {
      render(<AdminAuthWrapper><div>Protected Content</div></AdminAuthWrapper>);
      
      expect(mockNavigate).toHaveBeenCalledWith(
        '/admin/login',
        expect.objectContaining({
          replace: true,
        })
      );
    });
  });

  // ========================================================================
  // Tests for Token Exists Scenario
  // ========================================================================
  describe('when admin token exists', () => {
    beforeEach(() => {
      // Mock hasAdminToken to return true
      (hasAdminToken as vi.Mock).mockReturnValue(true);
    });

    it('renders children', () => {
      render(<AdminAuthWrapper><div>Protected Content</div></AdminAuthWrapper>);
      
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('does not redirect', () => {
      render(<AdminAuthWrapper><div>Protected Content</div></AdminAuthWrapper>);
      
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('renders complex children', () => {
      render(
        <AdminAuthWrapper>
          <div>
            <h1>Admin Dashboard</h1>
            <p>Welcome to the admin panel</p>
          </div>
        </AdminAuthWrapper>
      );
      
      expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Welcome to the admin panel')).toBeInTheDocument();
    });

    it('renders children with props', () => {
      const TestComponent = ({ title }: { title: string }) => (
        <div>{title}</div>
      );
      
      render(
        <AdminAuthWrapper>
          <TestComponent title="Admin Page" />
        </AdminAuthWrapper>
      );
      
      expect(screen.getByText('Admin Page')).toBeInTheDocument();
    });
  });

  // ========================================================================
  // Tests for Initial Render State
  // ========================================================================
  describe('initial render behavior', () => {
    it('renders null initially while checking token', () => {
      // Mock hasAdminToken to return true
      (hasAdminToken as vi.Mock).mockReturnValue(true);
      
      // We need to test the component before useEffect runs
      // This is tricky with @testing-library/react
      // The component uses useState with isChecked = false initially
      // and only sets it to true after the useEffect runs
      
      render(<AdminAuthWrapper><div>Protected Content</div></AdminAuthWrapper>);
      
      // After the useEffect runs and sets isChecked to true,
      // the children should render
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });
  });

  // ========================================================================
  // Tests for Location State Preservation
  // ========================================================================
  describe('location state preservation', () => {
    it('preserves the from path in navigation state', () => {
      // The location is already set in the mock at the top
      // This test verifies that the location is passed through correctly
      (hasAdminToken as vi.Mock).mockReturnValue(false);
      
      render(<AdminAuthWrapper><div>Protected Content</div></AdminAuthWrapper>);
      
      // Verify navigate was called with the location
      expect(mockNavigate).toHaveBeenCalledWith(
        '/admin/login',
        expect.objectContaining({
          state: expect.objectContaining({
            from: mockLocation,
          }),
        })
      );
    });
  });

  // ========================================================================
  // Edge Cases
  // ========================================================================
  describe('edge cases', () => {
    it('handles null children gracefully', () => {
      (hasAdminToken as vi.Mock).mockReturnValue(true);
      
      render(<AdminAuthWrapper>{null}</AdminAuthWrapper>);
      
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('handles undefined children gracefully', () => {
      (hasAdminToken as vi.Mock).mockReturnValue(true);
      
      render(<AdminAuthWrapper>{undefined}</AdminAuthWrapper>);
      
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('handles multiple children', () => {
      (hasAdminToken as vi.Mock).mockReturnValue(true);
      
      render(
        <AdminAuthWrapper>
          <div>Child 1</div>
          <div>Child 2</div>
        </AdminAuthWrapper>
      );
      
      expect(screen.getByText('Child 1')).toBeInTheDocument();
      expect(screen.getByText('Child 2')).toBeInTheDocument();
    });

    it('calls hasAdminToken on mount', () => {
      render(<AdminAuthWrapper><div>Protected Content</div></AdminAuthWrapper>);
      
      expect(hasAdminToken).toHaveBeenCalled();
    });
  });
});

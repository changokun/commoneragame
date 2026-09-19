import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import { hasAdminToken } from "../services/adminAuth";

/**
 * Props for AdminAuthWrapper component
 * children: The content to render if user is authenticated as admin
 */
interface AdminAuthWrapperProps {
  children: React.ReactNode;
}

/**
 * AdminAuthWrapper - Protects admin routes by checking for stored admin token
 * 
 * This component wraps admin route content and performs the following:
 * 1. Checks if there's a stored admin token (synchronous check via hasAdminToken)
 * 2. If token exists, renders the protected children content immediately
 * 3. If no token, redirects to /admin/login
 * 
 * Note: We do NOT make an API call to /admin/check on every route change.
 * This is intentional for performance - the token validation happens when
 * actual API calls are made. The backend will return 401/403 for any
 * unauthorized admin API requests, which should be handled by the calling code.
 * 
 * The wrapper preserves the original requested path so users can be redirected
 * back to where they were trying to go after successful login.
 * 
 * @param props - Component props containing children to protect
 * @returns The protected content or a redirect to login
 */
export function AdminAuthWrapper({ children }: AdminAuthWrapperProps) {
  // State to track if we've completed the initial auth check
  // This prevents flashing content before redirecting
  const [isChecked, setIsChecked] = useState(false);
  
  // Router hooks
  const navigate = useNavigate();
  const location = useLocation();
  
  // Check admin authentication on component mount
  // This is a synchronous check - no API call needed
  useEffect(() => {
    // Check if we have a token
    const hasToken = hasAdminToken();
    
    if (!hasToken) {
      // No token - redirect to login
      navigate("/admin/login", {
        state: { from: location },
        replace: true,
      });
    }
    
    // Mark that we've completed the check
    // This allows us to render children immediately if token exists
    setIsChecked(true);
  }, [navigate, location]);
  
  // Only render children after we've checked for token
  // This prevents flashing content before redirecting
  if (!isChecked) {
    return null;
  }
  
  // If we have a token and isChecked is true, render the protected content
  // Note: The backend will still validate the token on any actual API calls
  // and return 401/403 if the token is invalid or expired
  return <>{children}</>;
}

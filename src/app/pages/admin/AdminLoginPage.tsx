import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Card } from "../../components/ui/card";
import { Loader2 } from "lucide-react";
import { loginAdmin, hasAdminToken, checkAdminStatus } from "../../services/adminAuth";

/**
 * AdminLoginPage - Login form for admin authentication
 * 
 * This page provides a login form that POSTs credentials to the /admin/login endpoint.
 * On successful login, the user is redirected to the originally requested admin page.
 * 
 * Features:
 * - Form with username and password fields
 * - Loading state during API calls
 * - Error handling with user-friendly messages
 * - Redirect logic to preserve the original requested path
 * - Auto-check: if already logged in as admin, redirect to admin dashboard
 * 
 * @returns A React component with the admin login form
 */
export function AdminLoginPage() {
  // State for form inputs
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  
  // State for UI feedback
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Router hooks for navigation
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get the redirect path from location state or default to /admin
  // This preserves where the user was trying to go before being redirected to login
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || "/admin";
  
  // Check if user is already authenticated as admin on component mount
  // If so, redirect to the requested page
  useEffect(() => {
    const checkExistingAuth = async () => {
      // First, check if there's a stored token
      if (hasAdminToken()) {
        try {
          // Verify the token is still valid
          const isAdmin = await checkAdminStatus();
          if (isAdmin) {
            // Already authenticated, redirect to requested page
            navigate(from, { replace: true });
          }
        } catch (err) {
          // Token validation failed, continue to login form
          console.error("Admin token validation failed:", err);
        }
      }
    };
    
    checkExistingAuth();
  }, [from, navigate]);
  
  /**
   * Handle form submission
   * Posts credentials to /admin/login endpoint via the adminAuth service
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Attempt to login with provided credentials
      await loginAdmin(username, password);
      
      // Login successful - redirect to the originally requested page
      setSuccess("Login successful! Redirecting...");
      navigate(from, { replace: true });
      
    } catch (err) {
      // Login failed - show error message
      const errorMessage = err instanceof Error ? err.message : "Login failed. Please try again.";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * Clear error message when user starts typing
   */
  const handleInputChange = () => {
    if (error) {
      setError(null);
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="p-8 w-full max-w-md shadow-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">Admin Login</h1>
          <p className="text-muted-foreground mt-2">
            Please enter your admin credentials
          </p>
        </div>
        
        {/* Success message (briefly shown before redirect) */}
        {success && (
          <div className="mb-4 p-4 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg text-center">
            {success}
          </div>
        )}
        
        {/* Error message */}
        {error && (
          <div className="mb-4 p-4 bg-destructive/10 text-destructive rounded-lg text-center">
            {error}
          </div>
        )}
        
        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Username Field */}
          <div className="space-y-2">
            <label htmlFor="username" className="block text-sm font-medium">
              Username
            </label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                handleInputChange();
              }}
              placeholder="Enter admin username"
              disabled={isLoading}
              autoComplete="username"
              autoFocus
            />
          </div>
          
          {/* Password Field */}
          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm font-medium">
              Password
            </label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                handleInputChange();
              }}
              placeholder="Enter admin password"
              disabled={isLoading}
              autoComplete="current-password"
            />
          </div>
          
          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={isLoading || !username || !password}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Logging in...
              </>
            ) : (
              "Login"
            )}
          </Button>
        </form>
        
        {/* Footer info */}
        <p className="text-center text-sm text-muted-foreground mt-6">
          Go away.
        </p>
      </Card>
    </div>
  );
}

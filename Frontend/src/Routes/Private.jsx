import React, { useContext, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { chatContext } from '../Context/Context';
import axiosInstance from '../utils/axios'; // Adjust path as needed

const Private = ({ children }) => {
  const { logout, setUsername, setIsRegistered } = useContext(chatContext);
  const [isValidating, setIsValidating] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const validateToken = async () => {
      try {
        // Make a request to verify the JWT token in cookie
        // Since cookies are sent automatically, no need to manually attach token
        const response = await axiosInstance.get('/user/auth/me');
        
        if (response.status === 200 && response.data) {
          // Token is valid, user is authenticated
          setIsAuthenticated(true);
          
          // Update context with user data from response
          if (setUsername && response.data.name) {
            setUsername(response.data.name);
          }
          if (setIsRegistered) {
            setIsRegistered(true);
          }
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Token validation failed:', error);
        
        // If token is expired, invalid, or not present
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
          console.log('Token expired or invalid, logging out...');
          
          // Clear context state
          if (logout) {
            logout();
          } else {
            // Fallback if logout function not available
            if (setUsername) setUsername('');
            if (setIsRegistered) setIsRegistered(false);
          }
        }
        
        setIsAuthenticated(false);
      } finally {
        setIsValidating(false);
      }
    };

    validateToken();
  }, [logout, setUsername, setIsRegistered]);

  // Show loading spinner while validating token
  if (isValidating) {
    return (
      <div className="flex justify-center items-center w-full h-screen bg-zinc-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Validating session...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Render protected component if authenticated
  return children;
};

export default Private;
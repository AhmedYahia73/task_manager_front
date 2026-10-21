import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './routes'; // Import the router configuration
import { Toaster } from 'sonner';
import { ThemeProvider } from './components/ThemeProvider';
import { RoleNameProvider } from './context/RoleNameContext';

function App() {
  return (
    <ThemeProvider defaultTheme="theme-sunny">
      <RoleNameProvider>
        <RouterProvider router={router} />
        <Toaster richColors position="top-right" />
      </RoleNameProvider>
    </ThemeProvider>
  );
}

export default App;
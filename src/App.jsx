import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './routes'; // Import the router configuration
import { Toaster } from 'sonner';
import { ThemeProvider } from './components/ThemeProvider';

function App() {
  return (
    <ThemeProvider defaultTheme="theme-sunny">
      <RouterProvider router={router} />
      <Toaster richColors position="top-right" />
    </ThemeProvider>
  );
}

export default App;
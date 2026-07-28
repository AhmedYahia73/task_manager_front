import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './routes'; // Import the router configuration
import { Toaster } from 'sonner';

function App() {
  return (
    <>
    <RouterProvider router={router} />
    <Toaster richColors position="top-right" />
    </>
  );
}

export default App;
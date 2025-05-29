// src/app/layout.jsx
'use client';

import { SessionProvider } from 'next-auth/react';
import CssBaseline from '@mui/material/CssBaseline';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>
          <CssBaseline />
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
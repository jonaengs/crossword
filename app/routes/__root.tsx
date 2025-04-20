import { Outlet, ScrollRestoration, createRootRoute } from '@tanstack/react-router';
import { ReactNode } from 'react';
import { Meta, Scripts } from '@tanstack/start';
import '~/style.css';

export const Route = createRootRoute({
  head: () => ({
    meta: [{ charSet: 'utf-8' }, { title: 'My Crossword App' }],
  }),
  component: RootComponent,
});

function RootComponent() {
  return (
    <RootDocumet>
      <Outlet />
    </RootDocumet>
  );
}

function RootDocumet({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html>
      <head>
        <Meta />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

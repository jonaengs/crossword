import { hydrateRoot } from 'react-dom/client';
import { createRouter } from './router';
import { StartClient } from '@tanstack/start';

// TODO: Add a short readme for the project

const router = createRouter();

hydrateRoot(document, <StartClient router={router} />);

import { createServerFn } from '@tanstack/start';
import { promises as fs } from 'fs';
import { Crossword } from './lib/crossword';

interface CrosswordWithSlug {
  slug: string;
  crossword: Crossword;
}

const dataDir = process.cwd() + '/app/data';

export const saveCrossword = createServerFn({ method: 'POST' })
  .validator((data: CrosswordWithSlug) => data)
  .handler(async ({ data: { slug, crossword } }) => {
    await fs.writeFile(`${dataDir}/${slug}.json`, JSON.stringify(crossword));
  });

// TODO: Consider using a proper validator (zod, valibot)
export const getCrossword = createServerFn({ method: 'GET' })
  .validator((slug: string) => slug)
  .handler(async ({ data: slug }) => {
    const json = await fs.readFile(`${dataDir}/${slug}.json`, 'utf-8');
    return JSON.parse(json) as Crossword;
  });

export const listCrosswords = createServerFn({ method: 'GET' }).handler(async () => {
  const files = await fs.readdir(dataDir);
  return files
    .filter(
      // Protect against other files is .DS_Store
      (fileName) => fileName.endsWith('.json'),
    )
    .map((fileName) => fileName.replace(/\.json$/, ''));
});

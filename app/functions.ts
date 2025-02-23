import { createServerFn } from '@tanstack/start';
import { promises as fs } from 'fs';
import { EditableCrossword } from './lib/crossword';
import { notFound } from '@tanstack/react-router';

interface CrosswordWithSlug {
  slug: string;
  crossword: EditableCrossword;
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
    try {
      const json = await fs.readFile(`${dataDir}/${slug}.json`, 'utf-8');
      return JSON.parse(json) as EditableCrossword;
    } catch {
      throw notFound();
    }
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

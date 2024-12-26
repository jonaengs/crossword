import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useServerFn } from '@tanstack/start';
import Editor from '~/components/Editor';
import { saveCrossword } from '~/functions';
import { CrosswordEditorApplicationProvider, useCrosswordEditorApplicationContext } from '~/state/editor';
import { Dimensions, initCrossword } from '~/lib/crossword';
import { useState } from 'react';

export const Route = createFileRoute('/new')({
  component: RouteComponent,
});

function SaveForm() {
  const { crossword } = useCrosswordEditorApplicationContext();
  const postCrossword = useServerFn(saveCrossword);
  const navigate = useNavigate();

  return (
    <div className="self-center mt-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const form = e.currentTarget;
          const slugInput = form.elements.namedItem('slug') as HTMLInputElement;
          const slug = slugInput.value;
          // TODO: prepopulate the edit/$slug loader's query cache with the saved crossword
          postCrossword({ data: { slug: slug, crossword: crossword } }).then(() =>
            navigate({ to: '/edit/$slug', params: { slug } }),
          );
        }}
      >
        <label htmlFor="slug">Name: </label>
        <input type="text" name="slug" required />
        <button type="submit">Save</button>
      </form>
    </div>
  );
}

// TODO: Investigate how much work the react compiler is doing and whether we need to manually memoize something

function RouteComponent() {
  // TODO: Allow user to specify dimensions
  const [dimensions, setDimensions] = useState<Dimensions | null>(null);

  if (dimensions === null) {
    return (
      <div className="min-h-screen flex flex-col items-center">
        <h1 className="text-2xl font-semibold my-4">New Crossword</h1>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const form = e.currentTarget;
            const rowsInput = form.elements.namedItem('rows') as HTMLInputElement;
            const colsInput = form.elements.namedItem('cols') as HTMLInputElement;
            setDimensions({ rows: parseInt(rowsInput.value), cols: parseInt(colsInput.value) });
          }}
          className="grid grid-cols-2 w-40"
        >
          <label htmlFor="rows">Rows</label>
          <input type="number" name="rows" min="1" defaultValue="5" required />
          <label htmlFor="cols">Columns</label>
          <input type="number" name="cols" min="1" defaultValue="5" required />
          <button type="submit">Create</button>
        </form>
      </div>
    );
  }

  const initialCrossword = initCrossword(dimensions.rows, dimensions.cols);
  return (
    <CrosswordEditorApplicationProvider initialCrossword={initialCrossword}>
      <div className="min-h-screen flex flex-col">
        <Editor />;
        <SaveForm />
      </div>
    </CrosswordEditorApplicationProvider>
  );
}

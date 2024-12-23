import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useServerFn } from '@tanstack/start';
import Builder from '~/components/Builder';
import { saveCrossword } from '~/functions';
import { CrosswordApplicationProvider, initCrossword, useCrosswordApplicationContext } from '~/lib/context';

export const Route = createFileRoute('/new')({
  component: RouteComponent,
});

function SaveForm() {
  const { crossword } = useCrosswordApplicationContext();
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
        <label htmlFor="slug">Name</label>
        <input type="text" name="slug" />
        <button type="submit">Save</button>
      </form>
    </div>
  );
}

function RouteComponent() {
  // TODO: Allow user to specify dimensions
  const initialCrossword = initCrossword(5, 5);

  return (
    <CrosswordApplicationProvider initialCrossword={initialCrossword}>
      <div className="min-h-screen flex flex-col">
        <Builder />;
        <SaveForm />
      </div>
    </CrosswordApplicationProvider>
  );
}

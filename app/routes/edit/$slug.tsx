import { createFileRoute } from '@tanstack/react-router';
import { useServerFn } from '@tanstack/start';
import Editor from '~/components/Editor';
import { getCrossword, saveCrossword } from '~/functions';
import { CrosswordEditorApplicationProvider, useCrosswordEditorApplicationContext } from '~/state/editor';

export const Route = createFileRoute('/edit/$slug')({
  component: RouteComponent,
  loader: async ({ params: { slug } }) => getCrossword({ data: slug }),
});

function SaveButton({ slug }: { slug: string }) {
  const { crossword } = useCrosswordEditorApplicationContext();
  const postCrossword = useServerFn(saveCrossword);

  return (
    <button className="mt-4" onClick={() => postCrossword({ data: { slug, crossword } })}>
      Save
    </button>
  );
}

function RouteComponent() {
  const crossword = Route.useLoaderData();
  const slug = Route.useParams().slug;
  return (
    <div className="min-h-screen flex flex-col">
      <CrosswordEditorApplicationProvider initialCrossword={crossword}>
        <Editor />;
        <SaveButton slug={slug} />
      </CrosswordEditorApplicationProvider>
    </div>
  );
}

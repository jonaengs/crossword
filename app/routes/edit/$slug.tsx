import { createFileRoute } from '@tanstack/react-router';
import { useServerFn } from '@tanstack/start';
import Builder from '~/components/Builder';
import { getCrossword, saveCrossword } from '~/functions';
import { CrosswordApplicationProvider, useCrosswordApplicationContext } from '~/lib/context';

export const Route = createFileRoute('/edit/$slug')({
  component: RouteComponent,
  loader: async ({ params: { slug } }) => getCrossword({ data: slug }),
});

function SaveButton({ slug }: { slug: string }) {
  const { crossword } = useCrosswordApplicationContext();
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
    <CrosswordApplicationProvider initialCrossword={crossword}>
      <div className="min-h-screen flex flex-col">
        <Builder />;
        <SaveButton slug={slug} />
      </div>
    </CrosswordApplicationProvider>
  );
}

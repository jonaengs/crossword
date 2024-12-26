import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useServerFn } from '@tanstack/start';
import Editor from '~/components/Editor';
import { getCrossword, saveCrossword } from '~/functions';
import { CrosswordEditorApplicationProvider, useCrosswordEditorApplicationContext } from '~/state/editor';
import { CrosswordSolverApplicationProvider } from '~/state/solver';
import * as Dialog from '@radix-ui/react-dialog';
import Solver from '~/components/Solver';

export const Route = createFileRoute('/edit/$slug')({
  component: RouteComponent,
  loader: async ({ params: { slug } }) => getCrossword({ data: slug }),
  validateSearch: (search: { previewOpen?: boolean }) => search,
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

function PreviewButton({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { crossword } = useCrosswordEditorApplicationContext();

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Trigger asChild>
        <button className="mt-4">Preview</button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="bg-black/15 fixed inset-0" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white min-h-44 p-4">
          <Dialog.Close asChild>
            <button className="float-right">Close</button>
          </Dialog.Close>
          <CrosswordSolverApplicationProvider initialCrossword={crossword}>
            <Solver />
          </CrosswordSolverApplicationProvider>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function RouteComponent() {
  const crossword = Route.useLoaderData();
  const slug = Route.useParams().slug;
  const previewOpen = Route.useSearch().previewOpen ?? false;
  const navigate = useNavigate({ from: Route.fullPath });

  function setPreviewOpen(open: boolean) {
    navigate({ search: open ? { previewOpen: open } : {} });
  }
  return (
    <div className="min-h-screen flex flex-col">
      <CrosswordEditorApplicationProvider initialCrossword={crossword}>
        <Editor />
        <div className="flex flex-row justify-center gap-2">
          <SaveButton slug={slug} />
          <PreviewButton open={previewOpen} onOpenChange={setPreviewOpen} />
        </div>
      </CrosswordEditorApplicationProvider>
    </div>
  );
}

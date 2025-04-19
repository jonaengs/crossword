import { createFileRoute } from '@tanstack/react-router';
import Solver from '~/components/Solver';
import { deserializeCrossword } from '~/lib/serde';
import { CrosswordSolverApplicationProvider } from '~/state/solver';

export const Route = createFileRoute('/share/$encoded')({
  component: RouteComponent,
  loader: async ({ params: { encoded } }) => deserializeCrossword(encoded),
});

// TODO: Add 'title' to crossword data so that titles can also be shared
function RouteComponent() {
  const crossword = Route.useLoaderData();
  return (
    <div className="min-h-screen flex flex-col items-center">
      <h1 className="text-2xl font-semibold my-4">Shared Crossword</h1>
      <CrosswordSolverApplicationProvider initialCrossword={crossword}>
        <Solver />
      </CrosswordSolverApplicationProvider>
    </div>
  );
}

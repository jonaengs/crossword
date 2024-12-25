import { createFileRoute } from '@tanstack/react-router';
import Solver from '~/components/Solver';
import { getCrossword } from '~/functions';
import { CrosswordSolverApplicationProvider } from '~/state/solver';

export const Route = createFileRoute('/solve/$slug')({
  component: RouteComponent,
  loader: async ({ params: { slug } }) => getCrossword({ data: slug }),
});

function RouteComponent() {
  const crossword = Route.useLoaderData();
  const { slug } = Route.useParams();
  return (
    <div className="min-h-screen flex flex-col items-center">
      <h1 className="text-2xl font-semibold my-4">{slug}</h1>
      <CrosswordSolverApplicationProvider initialCrossword={crossword}>
        <Solver />
      </CrosswordSolverApplicationProvider>
    </div>
  );
}

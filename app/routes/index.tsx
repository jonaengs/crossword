import { Link, createFileRoute } from '@tanstack/react-router';
import { listCrosswords } from '~/functions';

export const Route = createFileRoute('/')({
  component: RouteComponent,
  loader: async () => {
    return { crosswords: await listCrosswords() };
  },
});

function RouteComponent() {
  const { crosswords } = Route.useLoaderData();
  return (
    <div className="flex flex-col items-center">
      <Link to="/new">Create a new crossword!</Link>
      <p>or</p>
      <ul>
        {crosswords.map((slug) => (
          <li key={slug} className="flex flex-row gap-4">
            <span className="w-32 truncate font-semibold">{slug}</span>
            <Link to={`/solve/$slug`} params={{ slug }}>
              Solve
            </Link>
            <Link to={`/edit/$slug`} params={{ slug }}>
              Edit
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

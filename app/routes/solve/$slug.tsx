import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/solve/$slug')({
  component: RouteComponent,
});

function RouteComponent() {
  const { slug } = Route.useParams();
  return <div>You are solving {slug}</div>;
}

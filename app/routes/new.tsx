import { createFileRoute } from '@tanstack/react-router';
import Builder from '~/components/Builder';

export const Route = createFileRoute('/new')({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="min-h-screen">
      <Builder />
    </div>
  );
}

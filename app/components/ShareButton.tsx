import { createRouter } from '@tanstack/react-router';
import { useServerFn } from '@tanstack/start';
import { getCrossword } from '~/functions';
import { serializeCrossword } from '~/lib/serde';
import { routeTree } from '~/routeTree.gen';

interface ShareButtonProps {
  crosswordSlug: string;
}

export function ShareableLinkButton({ crosswordSlug, children }: React.PropsWithChildren<ShareButtonProps>) {
  const fetchCrossword = useServerFn(getCrossword);
  async function onClick() {
    const data = await fetchCrossword({ data: crosswordSlug });
    const encoded = await serializeCrossword(data);
    const router = createRouter({ routeTree });
    const href = router.buildLocation({
      to: '/share/$encoded',
      params: {
        encoded: encoded,
      },
    }).href;
    navigator.clipboard.writeText(href);
  }

  return <button onClick={onClick}>{children}</button>;
}

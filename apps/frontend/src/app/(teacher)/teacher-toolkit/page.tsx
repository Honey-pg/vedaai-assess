import { TopBar } from '@/components/layout/TopBar';
import { ComingSoonPlaceholder } from '@/components/layout/ComingSoonPlaceholder';

export default function ToolkitPage() {
  return (
    <>
      <TopBar title="AI Teacher's Toolkit" backHref="/assignments" />
      <ComingSoonPlaceholder title="AI Teacher's Toolkit" />
    </>
  );
}

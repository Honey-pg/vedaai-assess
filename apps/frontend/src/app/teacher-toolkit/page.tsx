import { AppShell } from '@/components/layout/AppShell';
import { TopBar } from '@/components/layout/TopBar';
import { ComingSoonPlaceholder } from '@/components/layout/ComingSoonPlaceholder';

export default function ToolkitPage() {
  return (
    <AppShell>
      <TopBar title="AI Teacher's Toolkit" backHref="/assignments" />
      <ComingSoonPlaceholder title="AI Teacher's Toolkit" />
    </AppShell>
  );
}

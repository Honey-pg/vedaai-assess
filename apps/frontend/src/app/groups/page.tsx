import { AppShell } from '@/components/layout/AppShell';
import { TopBar } from '@/components/layout/TopBar';
import { ComingSoonPlaceholder } from '@/components/layout/ComingSoonPlaceholder';

export default function GroupsPage() {
  return (
    <AppShell>
      <TopBar title="My Groups" backHref="/assignments" />
      <ComingSoonPlaceholder title="My Groups" />
    </AppShell>
  );
}

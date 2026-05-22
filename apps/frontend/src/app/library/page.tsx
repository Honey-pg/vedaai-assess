import { AppShell } from '@/components/layout/AppShell';
import { TopBar } from '@/components/layout/TopBar';
import { ComingSoonPlaceholder } from '@/components/layout/ComingSoonPlaceholder';

export default function LibraryPage() {
  return (
    <AppShell>
      <TopBar title="My Library" backHref="/assignments" />
      <ComingSoonPlaceholder title="My Library" />
    </AppShell>
  );
}

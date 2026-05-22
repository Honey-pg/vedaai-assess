import { AppShell } from '@/components/layout/AppShell';
import { TopBar } from '@/components/layout/TopBar';
import { ComingSoonPlaceholder } from '@/components/layout/ComingSoonPlaceholder';

export default function SettingsPage() {
  return (
    <AppShell>
      <TopBar title="Settings" backHref="/assignments" />
      <ComingSoonPlaceholder title="Settings" />
    </AppShell>
  );
}

import { Settings } from 'lucide-react';

import AppHeader from '@/components/ui/AppHeader';
import { ComingSoonPlaceholder } from '@/components/layout/ComingSoonPlaceholder';

export default function SettingsPage() {
  return (
    <div className="flex flex-col min-h-[60vh] page-enter pb-28 md:pb-10">
      <div className="px-4 md:px-2">
        <AppHeader breadcrumb="Settings" icon={<Settings className="h-[17px] w-[17px]" strokeWidth={2} />} />
      </div>
      <ComingSoonPlaceholder
        title="Settings"
        showTitle={false}
        description="Account preferences and school defaults will live here. For now, use the sidebar to get back to your workflow."
      />
    </div>
  );
}

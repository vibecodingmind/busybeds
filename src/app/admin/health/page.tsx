export const dynamic = 'force-dynamic';
import HealthClient from './HealthClient';

export default async function HealthPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">System Health</h1>
      <HealthClient />
    </div>
  );
}

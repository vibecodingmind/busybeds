import Navbar from '@/components/Navbar';
import OnboardingWizard from './OnboardingWizard';

export const metadata = {
  title: 'Get Started — BusyBeds',
  description: 'List your hotel on BusyBeds and reach thousands of deal-seeking guests.',
};

export default function OnboardingPage() {
  return (
    <>
      <Navbar />
      <OnboardingWizard />
    </>
  );
}

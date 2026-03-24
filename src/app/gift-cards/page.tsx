import Navbar from '@/components/Navbar';
import GiftCardClient from './GiftCardClient';

export const metadata = {
  title: 'Gift Cards — BusyBeds',
  description: 'Give the gift of travel. Buy a BusyBeds gift card for someone special.',
};

export default function GiftCardsPage() {
  return (
    <>
      <Navbar />
      <GiftCardClient />
    </>
  );
}

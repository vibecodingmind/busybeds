import Navbar from '@/components/Navbar';
import MapClient from './MapClient';

export const metadata = {
  title: 'Hotel Map — BusyBeds',
  description: 'Explore hotels on an interactive map. Find discount hotels near you.',
};

export default function MapPage() {
  return (
    <>
      <Navbar />
      <MapClient />
    </>
  );
}

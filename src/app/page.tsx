'use client';

import dynamic from 'next/dynamic';
import ClientOnlyWrapper from '../components/ClientOnlyWrapper';

// Dynamically import the main component to prevent SSR
const App = dynamic(() => import('../components/App'), {
  ssr: false,
  loading: () => <div>Loading...</div>
});

export default function Home() {
  return (
    <ClientOnlyWrapper fallback={<div>Loading...</div>}>
      <App />
    </ClientOnlyWrapper>
  );
}

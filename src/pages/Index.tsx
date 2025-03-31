import React from 'react';
import LandingHero from '@/components/LandingHero';

const Index = () => {
  return (
    <div className="min-h-screen">
      <LandingHero />
      <div className="max-w-7xl mx-auto pb-20 px-4 sm:px-6 lg:px-8">
        {/* Additional landing page content could go here */}
      </div>
    </div>
  );
};

export default Index;

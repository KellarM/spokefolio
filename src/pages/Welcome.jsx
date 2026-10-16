import React from 'react';
import WelcomeNav from '@/components/welcome/WelcomeNav';
import WelcomeHero from '@/components/welcome/WelcomeHero';
import WelcomeShowcase from '@/components/welcome/WelcomeShowcase';
import WelcomeSteps from '@/components/welcome/WelcomeSteps';
import WelcomeFooter from '@/components/welcome/WelcomeFooter';

export default function Welcome() {
  return (
    <div className="rustic min-h-screen bg-background font-body text-foreground">
      <div className="h-1.5 w-full bg-primary" aria-hidden="true" />
      <WelcomeNav />
      <WelcomeHero />
      <WelcomeShowcase />
      <WelcomeSteps />
      <WelcomeFooter />
    </div>
  );
}
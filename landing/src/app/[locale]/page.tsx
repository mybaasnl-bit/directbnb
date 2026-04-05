import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Hero from '@/components/sections/Hero';
import Problem from '@/components/sections/Problem';
import Solution from '@/components/sections/Solution';
import HowItWorks from '@/components/sections/HowItWorks';
import Features from '@/components/sections/Features';
import BetaProgram from '@/components/sections/BetaProgram';
import SignupForm from '@/components/sections/SignupForm';
import SocialProof from '@/components/sections/SocialProof';

export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Problem />
        <Solution />
        <HowItWorks />
        <Features />
        <SocialProof />
        <BetaProgram />
        <SignupForm />
      </main>
      <Footer />
    </>
  );
}

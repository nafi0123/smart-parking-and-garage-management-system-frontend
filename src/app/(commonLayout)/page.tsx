import Banner from '@/components/Banner';
import Container from '@/components/Container';
import FAQSection from '@/components/FAQSection';
import HowItWorksSection from '@/components/HowItWorksSection';
import RecentGaragesSection from '@/components/RecentGaragesSection';
import StatsCounterSection from '@/components/StatsCounterSection';
import WhyChooseUsSection from '@/components/WhyChooseUsSection';

export default function HomePage() {
  return (
    <div className="space-y-6 sm:space-y-10">
      {/* 1. Hero Banner Slider */}
      <div className="pt-6 sm:pt-8">
        <Container>
          <Banner />
        </Container>
      </div>

      {/* 2. Platform Impact & Live Stats Counter */}
      <Container>
        <StatsCounterSection />
      </Container>

      {/* 3. Recent Smart Garages (8 cards in 4-column grid) */}
      <Container>
        <RecentGaragesSection />
      </Container>

      {/* 4. How It Works (3 Steps) */}
      <Container>
        <HowItWorksSection />
      </Container>

      {/* 5. Why Choose ParkWise */}
      <Container>
        <WhyChooseUsSection />
      </Container>

      {/* 6. Frequently Asked Questions */}
      <FAQSection />
    </div>
  );
}

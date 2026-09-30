import Banner from '@/components/Banner';
import Container from '@/components/Container';
import FAQSection from '@/components/FAQSection';

export default function HomePage() {
  return (
    <div className="space-y-6 sm:space-y-10">
      <div className="pt-6 sm:pt-8">
        <Container>
          <Banner />
        </Container>
      </div>

      {/* Frequently Asked Questions Section */}
      <FAQSection />
    </div>
  );
}


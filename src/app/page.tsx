import HeroCopy from "./components/HeroCopy";
import HeroParallaxBg from "./components/HeroParallaxBg";
import HomeContactStrip from "./components/HomeContactStrip";
import HomeCredibilityStrip from "./components/HomeCredibilityStrip";
import HomeFaq from "./components/HomeFaq";
import HomeHowItWorks from "./components/HomeHowItWorks";
import HomeTrustStrip from "./components/HomeTrustStrip";
import HomeWhatsIncluded from "./components/HomeWhatsIncluded";
import HomeScrollHeader from "./components/HomeScrollHeader";
import HomeReviewsWheel from "./components/HomeReviewsWheel";
import ScrollHero from "./components/ScrollHero";
import SiteFooter from "./components/SiteFooter";
import SiteHeader from "./components/SiteHeader";
import CarsBrowser from "./components/CarsBrowser";
import HomeAvailableCarsHashScroll from "./components/HomeAvailableCarsHashScroll";
import { listCars } from "@/lib/cars";
import { listRecentReviews } from "@/lib/reviews";

export default async function Home() {
  const cars = await listCars();
  const reviews = await listRecentReviews(12);

  return (
    <ScrollHero>
      <div className="site-shell">
        <HomeAvailableCarsHashScroll />
        <HomeScrollHeader>
          <SiteHeader />
        </HomeScrollHeader>

        <section className="hero-image-section">
          <HeroParallaxBg />
          <div className="hero-image-section-overlay" aria-hidden="true" />
          <HeroCopy />
        </section>

        <main className="site-content" id="home-site-content">
          <section className="content-canvas" id="cars" aria-label="Available rental cars">
            <HomeCredibilityStrip />

            <div className="home-section home-section--prelude">
              <div className="home-prelude">
                <HomeTrustStrip />
                <HomeHowItWorks />
              </div>
            </div>

            <div className="home-cars-faq-split" aria-hidden="true" id="available-cars-scroll-mark">
              <span className="home-cars-faq-split-line" />
            </div>

            <div className="home-section home-section--fleet">
              <CarsBrowser cars={cars} />
            </div>

            <div className="home-section home-section--reviews">
              <div className="home-reviews-stack">
                <HomeReviewsWheel reviews={reviews} />
              </div>
            </div>

            <div className="home-cars-faq-split" aria-hidden="true">
              <span className="home-cars-faq-split-line" />
            </div>

            <div className="home-section home-section--bottom">
              <div className="home-bottom-stack">
                <HomeFaq />
                <HomeContactStrip />
                <HomeWhatsIncluded />
              </div>
            </div>
          </section>
        </main>

        <SiteFooter />
      </div>
    </ScrollHero>
  );
}

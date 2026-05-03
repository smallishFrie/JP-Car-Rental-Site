import HeroCopy from "./components/HeroCopy";
import HomeContactStrip from "./components/HomeContactStrip";
import HomeFaq from "./components/HomeFaq";
import HomeHowItWorks from "./components/HomeHowItWorks";
import HomeTrustStrip from "./components/HomeTrustStrip";
import HomeWhatsIncluded from "./components/HomeWhatsIncluded";
import ScrollHero from "./components/ScrollHero";
import SiteFooter from "./components/SiteFooter";
import SiteHeader from "./components/SiteHeader";
import CarsBrowser from "./components/CarsBrowser";
import { listCars } from "@/lib/cars";

export default async function Home() {
  const cars = await listCars();

  return (
    <ScrollHero>
      <div className="site-shell">
        <SiteHeader />

        <section className="hero-image-section">
          <div aria-hidden="true" />
          <HeroCopy />
        </section>

        <main className="site-content">
          <section className="content-canvas" id="cars" aria-label="Available rental cars">
            <div className="home-prelude">
              <HomeTrustStrip />
              <HomeHowItWorks />
            </div>
            <div className="home-cars-faq-split" aria-hidden="true">
              <span className="home-cars-faq-split-line" />
            </div>
            <CarsBrowser cars={cars} />

            <div className="home-cars-faq-split" aria-hidden="true">
              <span className="home-cars-faq-split-line" />
            </div>

            <div className="home-bottom-stack">
              <HomeFaq />
              <HomeContactStrip />
              <HomeWhatsIncluded />
            </div>
          </section>
        </main>

        <SiteFooter />
      </div>
    </ScrollHero>
  );
}

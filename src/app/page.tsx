import HeroCopy from "./components/HeroCopy";
import ScrollHero from "./components/ScrollHero";
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
            <CarsBrowser cars={cars} />
          </section>
        </main>
      </div>
    </ScrollHero>
  );
}

import { createRootRoute, Link, Outlet } from "@tanstack/react-router";
import Lenis from "lenis";
import { domAnimation, LazyMotion, MotionConfig } from "motion/react";
import { useEffect } from "react";
import { SiteFooter } from "@/components/site-footer";
import { SiteNav } from "@/components/site-nav";

export const Route = createRootRoute({ component: RootLayout, notFoundComponent: NotFound });

function RootLayout() {
  // Smooth wheel scrolling for the whole page. Skipped when the OS asks for reduced motion.
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const lenis = new Lenis({ autoRaf: true });
    return () => lenis.destroy();
  }, []);

  return (
    // LazyMotion loads only the animation features the site uses. `strict` makes a stray
    // full `motion.*` component throw, so the bundle can't quietly grow back.
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">
        <SiteNav />
        <main>
          <Outlet />
        </main>
        <SiteFooter />
      </MotionConfig>
    </LazyMotion>
  );
}

function NotFound() {
  return (
    <section className="flex min-h-svh flex-col justify-center px-[4vw]">
      <title>Not found · fvx</title>
      <h1 className="text-[18vw] font-extrabold leading-none tracking-[-0.06em] md:text-[12vw]">404</h1>
      <Link to="/" className="mt-6 underline underline-offset-4">
        Back home
      </Link>
    </section>
  );
}

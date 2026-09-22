import { createRootRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import Lenis from "lenis";
import { domAnimation, LazyMotion, MotionConfig } from "motion/react";
import { useEffect } from "react";
import { IntroCurtain } from "@/components/intro-curtain";
import { SiteFooter } from "@/components/site-footer";
import { SiteNav } from "@/components/site-nav";
import { titleFor } from "@/content";

export const Route = createRootRoute({ component: RootLayout, notFoundComponent: NotFound });

function RootLayout() {
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const lenis = new Lenis({ autoRaf: true });
    return () => lenis.destroy();
  }, []);

  const pathname = useRouterState({ select: (state) => state.location.pathname });
  useEffect(() => {
    document.title = titleFor(pathname);
  }, [pathname]);

  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">
        <IntroCurtain />
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
      <h1 className="text-[18vw] font-extrabold leading-none tracking-[-0.06em] md:text-[12vw]">404</h1>
      <Link to="/" className="mt-6 underline underline-offset-4">
        Back home
      </Link>
    </section>
  );
}

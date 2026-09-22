import { createRootRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import type Lenis from "lenis";
import { useEffect } from "react";
import { IntroCurtain } from "@/components/intro-curtain";
import { SiteFooter } from "@/components/site-footer";
import { SiteNav } from "@/components/site-nav";
import { titleFor } from "@/content";

export const Route = createRootRoute({ component: RootLayout, notFoundComponent: NotFound });

function RootLayout() {
  useEffect(() => {
    // Lenis only smooths wheel scrolling, so touch screens never download it.
    if (!matchMedia("(pointer: fine) and (prefers-reduced-motion: no-preference)").matches) return;
    let lenis: Lenis | undefined;
    let cancelled = false;
    import("lenis").then((module) => {
      if (!cancelled) lenis = new module.default({ autoRaf: true });
    });
    return () => {
      cancelled = true;
      lenis?.destroy();
    };
  }, []);

  const pathname = useRouterState({ select: (state) => state.location.pathname });
  useEffect(() => {
    document.title = titleFor(pathname);
  }, [pathname]);

  return (
    <>
      <IntroCurtain />
      <SiteNav />
      <main>
        <Outlet />
      </main>
      <SiteFooter />
    </>
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

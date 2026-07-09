import { SiteHeader } from "@/components/site-header";
import { SECTIONS } from "@/components/sections/registry";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main>
        {SECTIONS.map(({ id, Component }) => (
          <Component key={id} />
        ))}
      </main>
    </>
  );
}

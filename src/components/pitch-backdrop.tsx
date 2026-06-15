/**
 * Fixed decorative backdrop: floodlight glows over a faint diagonal pitch-stripe
 * texture. Rendered once in the root layout, behind all page content.
 */
export function PitchBackdrop() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-background"
    >
      <div className="absolute inset-0 bg-pitch-stripes" />
      <div className="absolute -top-40 -left-40 h-[32rem] w-[32rem] rounded-full bg-primary/15 blur-[120px]" />
      <div className="absolute -right-40 bottom-0 h-[28rem] w-[28rem] rounded-full bg-primary/10 blur-[120px]" />
    </div>
  );
}

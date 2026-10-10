/** Keeps the Confirm button visible at the bottom of the screen, even above a long list of cars. */
export default function StickyBar({ children }: { children: React.ReactNode }) {
  return <div className="sticky bottom-0 -mx-5 border-t-2 border-line bg-paper/95 px-5 py-4 backdrop-blur">{children}</div>;
}

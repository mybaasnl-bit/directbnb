// Embed layout — no sidebar, no header, no footer.
// Renders clean so the widget blends into any external website.
export default function EmbedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="embed-root">
      {children}
    </div>
  );
}

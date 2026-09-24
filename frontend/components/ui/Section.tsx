export default function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="font-display text-xl text-paper">{title}</h2>
      <div className="text-sm text-muted space-y-3 leading-relaxed">{children}</div>
    </section>
  );
}

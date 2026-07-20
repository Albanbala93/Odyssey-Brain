import { Card } from "@/components/ui/Card";

export function FeedbackCard({
  eyebrow,
  children,
  tone = "neutral",
}: {
  eyebrow: string;
  children: React.ReactNode;
  tone?: "neutral" | "success";
}) {
  return (
    <Card className={tone === "success" ? "border-success/30 bg-success-soft" : undefined}>
      <p className="text-muted text-xs font-semibold tracking-wide uppercase">{eyebrow}</p>
      <p className="mt-2 text-sm leading-relaxed">{children}</p>
    </Card>
  );
}

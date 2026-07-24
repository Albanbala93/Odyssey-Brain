import { Card } from "@/components/ui/Card";

const TONE_CLASSES: Record<string, string> = {
  success: "border-success/30 bg-success-soft",
  warning: "border-warning/30 bg-warning-soft",
};

export function FeedbackCard({
  eyebrow,
  children,
  tone = "neutral",
}: {
  eyebrow: string;
  children: React.ReactNode;
  tone?: "neutral" | "success" | "warning";
}) {
  return (
    <Card className={TONE_CLASSES[tone]}>
      <p className="text-muted text-xs font-semibold tracking-wide uppercase">{eyebrow}</p>
      <p className="mt-2 text-sm leading-relaxed">{children}</p>
    </Card>
  );
}

export function UserMessage({ text }: { text: string }) {
  return (
    <div className="bg-accent text-accent-foreground max-w-[88%] self-end rounded-2xl rounded-br-sm px-4 py-3">
      <p className="text-base leading-relaxed">{text}</p>
    </div>
  );
}

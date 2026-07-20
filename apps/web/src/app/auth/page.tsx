"use client";

import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/lib/auth/auth-context";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AuthPage() {
  const router = useRouter();
  const { supabaseConfigured, signInWithMagicLink } = useAuth();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || status === "sending") return;
    setStatus("sending");
    const { error } = await signInWithMagicLink(email.trim());
    if (error) {
      setErrorMessage(error);
      setStatus("error");
      return;
    }
    setStatus("sent");
  }

  if (!supabaseConfigured) {
    return (
      <AppShell>
        <div className="flex flex-1 flex-col justify-center gap-4 px-6 text-center">
          <p className="text-muted text-sm font-black tracking-widest uppercase">Odyssey</p>
          <h1 className="text-2xl font-bold">La création de compte arrive bientôt</h1>
          <p className="text-muted text-sm">
            Cet environnement tourne pour l&apos;instant uniquement en mode invité : ta progression
            reste sur cet appareil. Aucune information n&apos;est requise pour continuer.
          </p>
          <Button onClick={() => router.push("/welcome")}>Continuer en mode invité</Button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="flex flex-1 flex-col justify-center gap-4 px-6">
        <p className="text-muted text-sm font-black tracking-widest uppercase">Odyssey</p>
        <h1 className="text-2xl font-bold">Créer un compte ou se connecter</h1>
        <p className="text-muted text-sm">
          Reçois un lien de connexion par e-mail — pas de mot de passe à retenir. Ta progression
          invité actuelle sera conservée.
        </p>

        {status === "sent" ? (
          <div className="border-success/30 bg-success-soft text-success rounded-2xl border p-4 text-sm">
            E-mail envoyé à <strong>{email}</strong>. Clique sur le lien qu&apos;il contient pour te
            connecter.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ton@email.com"
              className="border-border bg-surface rounded-2xl border px-4 py-3.5 text-base"
            />
            {status === "error" && errorMessage && (
              <p className="text-danger text-sm">{errorMessage}</p>
            )}
            <Button type="submit" disabled={status === "sending"}>
              {status === "sending" ? "Envoi en cours…" : "Recevoir le lien magique"}
            </Button>
          </form>
        )}

        <Button variant="ghost" onClick={() => router.push("/today")}>
          Continuer sans compte
        </Button>
      </div>
    </AppShell>
  );
}

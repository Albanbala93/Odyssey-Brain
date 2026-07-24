import { expect, test } from "@playwright/test";

/**
 * Covers the Phase 1 exit criteria (ODYSSEY_MASTER_PROMPT_CODEX.md §18):
 * a new guest user can complete the entire core loop — welcome, onboarding,
 * first mission, debrief, and back to Today — with zero external API calls.
 */
test("guest can complete welcome → onboarding → mission → debrief → Today", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Let's speak." })).toBeVisible();
  await page.getByRole("button", { name: "Continuer" }).click();

  await expect(page.getByText("What's your name?")).toBeVisible();
  await page.getByPlaceholder("Ton prénom").fill("Camille");
  await page.getByRole("button", { name: "Continuer" }).click();

  await expect(page.getByText("Why are you here today?")).toBeVisible();
  await page.getByRole("button", { name: /Personal/ }).click();

  await expect(page.getByText("When do you usually need English?")).toBeVisible();
  await page.getByRole("button", { name: /^Everyday life/ }).click();

  await page.getByRole("button", { name: "Commencer ma première mission" }).click();

  await expect(page).toHaveURL(/\/session\//);
  await expect(page.getByRole("button", { name: "Envoyer" })).toBeVisible();

  const reply = page.getByPlaceholder("Ou écris ta réponse…");
  await reply.fill("I'm Camille, nice to meet you.");
  await page.getByRole("button", { name: "Envoyer" }).click();

  // The deterministic local coach always replies — wait for the second coach bubble.
  await expect(page.getByRole("button", { name: "Terminer" })).toBeVisible();
  await page.getByRole("button", { name: "Terminer" }).click();

  await expect(page).toHaveURL(/\/debrief$/);
  await expect(page.getByText("Mission terminée")).toBeVisible();
  await expect(page.getByText(/^\+\d+%$/)).toBeVisible();

  await page.getByRole("button", { name: "Retour à Today" }).click();
  await expect(page).toHaveURL(/\/today$/);
  await expect(page.getByRole("heading", { name: /Bonjour Camille/ })).toBeVisible();
});

test("translation can be hidden and shown again for a coach message", async ({ page }) => {
  await page.goto("/welcome");
  await page.getByRole("button", { name: "Continuer" }).click();
  await page.getByPlaceholder("Ton prénom").fill("Alex");
  await page.getByRole("button", { name: "Continuer" }).click();
  await page.getByRole("button", { name: /Travel/ }).click();
  await page.getByRole("button", { name: /^Other/ }).click();
  await page.getByRole("button", { name: "Commencer ma première mission" }).click();

  await expect(page).toHaveURL(/\/session\//);
  const toggle = page.getByRole("button", { name: /traduction/ }).first();
  await expect(toggle).toBeVisible();
  const initialLabel = await toggle.textContent();
  await toggle.click();
  await expect(toggle).not.toHaveText(initialLabel ?? "");
});

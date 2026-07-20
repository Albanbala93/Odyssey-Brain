import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TranslationLayer } from "./TranslationLayer";

describe("TranslationLayer", () => {
  it("shows English always, and French only when defaultVisible is true", () => {
    render(<TranslationLayer english="Hello" french="Bonjour" defaultVisible={true} />);
    expect(screen.getByText("Hello")).toBeInTheDocument();
    expect(screen.getByText("Bonjour")).toBeInTheDocument();
  });

  it("hides French when defaultVisible is false", () => {
    render(<TranslationLayer english="Hello" french="Bonjour" defaultVisible={false} />);
    expect(screen.getByText("Hello")).toBeInTheDocument();
    expect(screen.queryByText("Bonjour")).not.toBeInTheDocument();
  });

  it("toggles visibility on click and reports the new state", () => {
    const onToggle = vi.fn();
    render(
      <TranslationLayer
        english="Hello"
        french="Bonjour"
        defaultVisible={false}
        onToggle={onToggle}
      />,
    );

    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByText("Bonjour")).toBeInTheDocument();
    expect(onToggle).toHaveBeenCalledWith(true);

    fireEvent.click(screen.getByRole("button"));
    expect(screen.queryByText("Bonjour")).not.toBeInTheDocument();
    expect(onToggle).toHaveBeenCalledWith(false);
  });
});

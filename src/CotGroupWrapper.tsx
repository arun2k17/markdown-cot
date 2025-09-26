// CotGroupWrapper.tsx
import * as React from "react";
import ChainOfThought from "./ChainOfThought";

function parseBool(v: unknown) {
  if (typeof v === "boolean") return v;
  if (typeof v === "string") return v.toLowerCase() === "true";
  return false;
}

export default function CotGroupWrapper(props: any) {
  // react-markdown passes { node, children, ...attrs }
  const { node, children, ...attrs } = props as Record<string, any>;

  const id = attrs["data-id"] ?? "";
  const title = attrs["data-title"] ?? "";
  const description = attrs["data-description"] ?? "";
  const status = attrs["data-status"] ?? "thinking";
  const closed = parseBool(attrs["data-closed"]);

  let steps: Array<{
    id: string;
    summary: string;
    description?: string;
    order: number;
  }> = [];
  const raw = attrs["data-steps"];
  if (typeof raw === "string" && raw.trim()) {
    try {
      steps = JSON.parse(raw);
    } catch {
      steps = [];
    }
  } else if (Array.isArray(raw)) {
    // (Defensive: in case another pipeline passes an array)
    steps = raw as any;
  }

  return (
    <ChainOfThought
      id={id}
      title={title || undefined}
      description={description || undefined}
      status={status}
      closed={closed}
      steps={steps}
    />
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { AuthForm } from "@/components/AuthForm";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Sign up — PuffSearch" },
      { name: "description", content: "Create a free PuffSearch account." },
      { property: "og:title", content: "Sign up — PuffSearch" },
      { property: "og:description", content: "Create a free PuffSearch account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <AuthForm mode="signup" />,
});

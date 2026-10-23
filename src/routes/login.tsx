import { createFileRoute } from "@tanstack/react-router";
import { AuthForm } from "@/components/AuthForm";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Log in — PuffSearch" },
      { name: "description", content: "Log in to your PuffSearch account." },
      { property: "og:title", content: "Log in — PuffSearch" },
      { property: "og:description", content: "Log in to your PuffSearch account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <AuthForm mode="login" />,
});

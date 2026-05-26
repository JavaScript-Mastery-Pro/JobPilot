import type { ReactNode } from "react";

import { AppShell } from "@/components/layout/AppShell";

type Props = {
  children: ReactNode;
};

export default function AuthenticatedAppLayout({ children }: Props) {
  return <AppShell>{children}</AppShell>;
}

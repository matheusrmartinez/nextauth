import { ReactNode } from "react";
import { useCan } from "../hooks/useCan";

type CanProps = {
  children: ReactNode;
  permissons?: string[];
  roles?: string[];
};

export function Can({ children, permissions, roles }) {
  const userCanSeeComponent = useCan({ permissions, roles });

  if (!userCanSeeComponent) {
    return null;
  }

  return <>{children}</>;
}

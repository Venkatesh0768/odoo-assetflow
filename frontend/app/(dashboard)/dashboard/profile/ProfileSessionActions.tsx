"use client";

import { useTransition } from "react";
import { logoutAction, logoutAllAction } from "@/lib/actions/auth";
import Button from "@/components/ui/Button";

export default function ProfileSessionActions() {
  const [logoutPending, startLogout] = useTransition();
  const [logoutAllPending, startLogoutAll] = useTransition();

  function handleLogout() {
    startLogout(() => {
      logoutAction();
    });
  }

  function handleLogoutAll() {
    if (!confirm("Sign out of all devices? You'll need to log in again everywhere."))
      return;
    startLogoutAll(() => {
      logoutAllAction();
    });
  }

  return (
    <div className="flex flex-wrap gap-3">
      <Button
        variant="secondary"
        size="sm"
        loading={logoutPending}
        onClick={handleLogout}
      >
        Sign out this device
      </Button>
      <Button
        variant="danger"
        size="sm"
        loading={logoutAllPending}
        onClick={handleLogoutAll}
      >
        Sign out all devices
      </Button>
    </div>
  );
}

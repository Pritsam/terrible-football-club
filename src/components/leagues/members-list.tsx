"use client";

import { useActionState, useTransition, useState } from "react";
import { Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field";
import { updateMemberRole, removeMember } from "@/lib/leagues/actions";

export interface LeagueMember {
  id: string;
  user_id: string;
  role: string;
  profiles: { name: string | null; email: string; avatar_url: string | null } | null;
}

interface MembersListProps {
  leagueId: string;
  members: LeagueMember[];
  currentUserId: string;
  isAdmin: boolean;
}

export function MembersList({ leagueId, members, currentUserId, isAdmin }: MembersListProps) {
  const [roleState, roleAction] = useActionState(updateMemberRole, undefined);
  const [removeState, removeAction] = useActionState(removeMember, undefined);
  const [isPending, startTransition] = useTransition();
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);

  const handleRoleChange = (membershipId: string, newRole: "admin" | "player") => {
    const formData = new FormData();
    formData.set("league_id", leagueId);
    formData.set("membership_id", membershipId);
    formData.set("role", newRole);
    startTransition(() => roleAction(formData));
  };

  const handleRemove = (membershipId: string) => {
    if (confirmRemoveId !== membershipId) {
      setConfirmRemoveId(membershipId);
      return;
    }
    const formData = new FormData();
    formData.set("league_id", leagueId);
    formData.set("membership_id", membershipId);
    startTransition(() => removeAction(formData));
    setConfirmRemoveId(null);
  };

  const errorMessage = roleState?.error ?? removeState?.error;

  return (
    <div className="flex flex-col gap-2">
      {errorMessage && <FieldError>{errorMessage}</FieldError>}
      <ul className="flex flex-col divide-y divide-border/40">
        {members.map((member) => {
          const displayName = member.profiles?.name ?? member.profiles?.email ?? "Unknown";
          const isCurrentUser = member.user_id === currentUserId;
          const isMemberAdmin = member.role === "admin";
          const isConfirmingRemove = confirmRemoveId === member.id;

          return (
            <li key={member.id} className="flex items-center gap-3 py-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-semibold">
                {displayName.charAt(0).toUpperCase()}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-sm font-medium text-foreground truncate">
                    {displayName}
                    {isCurrentUser && (
                      <span className="text-muted-foreground font-normal"> (you)</span>
                    )}
                  </span>
                  {isMemberAdmin && (
                    <span className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-xs font-medium bg-primary/10 text-primary">
                      <Shield className="size-3" />
                      Admin
                    </span>
                  )}
                </div>
                {member.profiles?.email && (
                  <p className="text-xs text-muted-foreground truncate">{member.profiles.email}</p>
                )}
              </div>

              {isAdmin && !isCurrentUser && (
                <div className="flex shrink-0 items-center gap-1">
                  {isMemberAdmin ? (
                    <Button
                      size="xs"
                      variant="ghost"
                      disabled={isPending}
                      onClick={() => handleRoleChange(member.id, "player")}
                    >
                      Make player
                    </Button>
                  ) : (
                    <>
                      <Button
                        size="xs"
                        variant="ghost"
                        disabled={isPending}
                        onClick={() => handleRoleChange(member.id, "admin")}
                      >
                        Make admin
                      </Button>
                      {isConfirmingRemove ? (
                        <>
                          <Button
                            size="xs"
                            variant="destructive"
                            disabled={isPending}
                            onClick={() => handleRemove(member.id)}
                          >
                            Confirm
                          </Button>
                          <Button
                            size="xs"
                            variant="ghost"
                            onClick={() => setConfirmRemoveId(null)}
                          >
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="xs"
                          variant="ghost"
                          disabled={isPending}
                          onClick={() => handleRemove(member.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          Remove
                        </Button>
                      )}
                    </>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

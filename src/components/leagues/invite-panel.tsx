"use client";

import { useState } from "react";
import { Copy, Check, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface InvitePanelProps {
  inviteCode: string;
}

export function InvitePanel({ inviteCode }: InvitePanelProps) {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const inviteLink =
    typeof window !== "undefined"
      ? `${window.location.origin}/join/${inviteCode}`
      : `/join/${inviteCode}`;

  const copyToClipboard = async (text: string, type: "code" | "link") => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === "code") {
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2000);
      } else {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      }
    } catch {
      // Fallback for older browsers
      const el = document.createElement("textarea");
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
  };

  return (
    <Card className="animate-fade-up bg-card/80 ring-foreground/10 [animation-delay:150ms]">
      <CardContent className="flex flex-col gap-4 py-5">
        <div>
          <p className="text-sm font-medium text-foreground">Invite players</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Share the code or link so players can join this league.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex flex-1 items-center rounded-lg border border-border bg-muted/30 px-3 py-2">
            <span className="font-mono text-sm tracking-widest text-foreground">
              {inviteCode}
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => copyToClipboard(inviteCode, "code")}
            className="shrink-0"
          >
            {copiedCode ? (
              <Check className="size-3.5 text-primary" />
            ) : (
              <Copy className="size-3.5" />
            )}
            {copiedCode ? "Copied!" : "Copy code"}
          </Button>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            copyToClipboard(
              typeof window !== "undefined"
                ? `${window.location.origin}/join/${inviteCode}`
                : `/join/${inviteCode}`,
              "link",
            )
          }
          className="w-full"
        >
          {copiedLink ? (
            <Check className="size-3.5 text-primary" />
          ) : (
            <LinkIcon className="size-3.5" />
          )}
          {copiedLink ? "Link copied!" : "Copy invite link"}
        </Button>
      </CardContent>
    </Card>
  );
}

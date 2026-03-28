"use client";

import * as React from "react";
import Link from "next/link";
import { Check, Loader2, Search, UserPlus, X } from "lucide-react";

import { MarketingHeader } from "@/components/marketing-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  apiAcceptFriendInvite,
  apiCancelOutgoingFriendInvite,
  apiDeclineFriendInvite,
  apiListFriends,
  apiListIncomingFriendInvites,
  apiListOutgoingFriendInvites,
  apiSearchFriendsByEmail,
  apiSendFriendInvite,
  getToken,
  type FriendEntryDTO,
  type FriendInviteListItemDTO,
  type FriendUserDTO,
} from "@/lib/api";
import { cn } from "@/lib/utils";

export default function FriendsPage() {
  const [friends, setFriends] = React.useState<FriendEntryDTO[]>([]);
  const [incoming, setIncoming] = React.useState<FriendInviteListItemDTO[]>([]);
  const [outgoing, setOutgoing] = React.useState<FriendInviteListItemDTO[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);

  const [searchQ, setSearchQ] = React.useState("");
  const [searchResults, setSearchResults] = React.useState<FriendUserDTO[]>([]);
  const [searching, setSearching] = React.useState(false);
  const [searched, setSearched] = React.useState(false);

  const [inviteEmail, setInviteEmail] = React.useState("");
  const [inviteBusy, setInviteBusy] = React.useState(false);
  const [rowBusy, setRowBusy] = React.useState<string | null>(null);

  const refreshAll = React.useCallback(async () => {
    const t = getToken();
    if (!t) return;
    const [f, inc, out] = await Promise.all([
      apiListFriends(t),
      apiListIncomingFriendInvites(t),
      apiListOutgoingFriendInvites(t),
    ]);
    setFriends(f.friends);
    setIncoming(inc.invites);
    setOutgoing(out.invites);
  }, []);

  React.useEffect(() => {
    (async () => {
      try {
        await refreshAll();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not load friends.");
      } finally {
        setLoading(false);
      }
    })();
  }, [refreshAll]);

  function flashNotice(text: string) {
    setNotice(text);
    window.setTimeout(() => setNotice(null), 3800);
  }

  async function onSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = searchQ.trim();
    if (q.length < 2) {
      setError("Type at least 2 characters to search.");
      return;
    }
    const t = getToken();
    if (!t) return;
    setError(null);
    setSearching(true);
    setSearched(true);
    try {
      const { users } = await apiSearchFriendsByEmail(t, q);
      setSearchResults(users);
    } catch (err) {
      setSearchResults([]);
      setError(err instanceof Error ? err.message : "Search failed.");
    } finally {
      setSearching(false);
    }
  }

  async function inviteUserId(toUserId: string) {
    const t = getToken();
    if (!t) return;
    setRowBusy(toUserId);
    setError(null);
    try {
      await apiSendFriendInvite(t, { toUserId });
      flashNotice("Invite sent.");
      await refreshAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send invite.");
    } finally {
      setRowBusy(null);
    }
  }

  async function inviteByEmail(e: React.FormEvent) {
    e.preventDefault();
    const em = inviteEmail.trim().toLowerCase();
    if (!em) return;
    const t = getToken();
    if (!t) return;
    setInviteBusy(true);
    setError(null);
    try {
      await apiSendFriendInvite(t, { toEmail: em });
      setInviteEmail("");
      flashNotice("Invite sent.");
      await refreshAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send invite.");
    } finally {
      setInviteBusy(false);
    }
  }

  async function acceptInvite(id: string) {
    const t = getToken();
    if (!t) return;
    setRowBusy(id);
    setError(null);
    try {
      await apiAcceptFriendInvite(t, id);
      flashNotice("You are now friends.");
      await refreshAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not accept.");
    } finally {
      setRowBusy(null);
    }
  }

  async function declineInvite(id: string) {
    const t = getToken();
    if (!t) return;
    setRowBusy(id);
    setError(null);
    try {
      await apiDeclineFriendInvite(t, id);
      await refreshAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not decline.");
    } finally {
      setRowBusy(null);
    }
  }

  async function cancelOutgoing(id: string) {
    const t = getToken();
    if (!t) return;
    setRowBusy(id);
    setError(null);
    try {
      await apiCancelOutgoingFriendInvite(t, id);
      await refreshAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not cancel.");
    } finally {
      setRowBusy(null);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <MarketingHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Friends</h1>
          <p className="text-muted-foreground">
            Search by email, send invites, and accept requests. Both people need an Acadomi account.
          </p>
        </div>

        {error ? (
          <Alert variant="destructive" className="mt-6">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        {notice ? (
          <Alert variant="success" className="mt-6">
            <AlertTitle>Done</AlertTitle>
            <AlertDescription>{notice}</AlertDescription>
          </Alert>
        ) : null}

        {loading ? (
          <div className="mt-10 flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Loading…
          </div>
        ) : (
          <div className="mt-8 space-y-8">
            <Card className="rounded-xl border border-border shadow-sm">
              <CardHeader>
                <CardTitle>Find people</CardTitle>
                <CardDescription>
                  Search registered users by email (partial match). Then send an invite.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <form onSubmit={onSearch} className="flex flex-col gap-3 sm:flex-row sm:items-end">
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="search-email">Email search</Label>
                    <Input
                      id="search-email"
                      type="text"
                      inputMode="email"
                      autoComplete="off"
                      value={searchQ}
                      onChange={(e) => setSearchQ(e.target.value)}
                      placeholder="name or domain, e.g. alex or @uni.edu"
                      className="h-11"
                    />
                  </div>
                  <Button type="submit" variant="secondary" className="h-11 shrink-0 gap-2" disabled={searching}>
                    {searching ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Search className="size-4" />
                    )}
                    Search
                  </Button>
                </form>
                {searched ? (
                  <div className="rounded-lg border border-border bg-muted/20 p-3">
                    {searchResults.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No matching accounts. Try another query.</p>
                    ) : (
                      <ul className="space-y-2">
                        {searchResults.map((u) => (
                          <li
                            key={u.id}
                            className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-background px-3 py-2 text-sm"
                          >
                            <div>
                              <p className="font-medium text-foreground">
                                {u.firstName} {u.lastName}
                              </p>
                              <p className="text-xs text-muted-foreground">{u.email}</p>
                            </div>
                            <Button
                              type="button"
                              size="sm"
                              className="gap-1"
                              disabled={rowBusy === u.id}
                              onClick={() => void inviteUserId(u.id)}
                            >
                              {rowBusy === u.id ? (
                                <Loader2 className="size-3.5 animate-spin" />
                              ) : (
                                <UserPlus className="size-3.5" />
                              )}
                              Invite
                            </Button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ) : null}
              </CardContent>
            </Card>

            <Card className="rounded-xl border border-border shadow-sm">
              <CardHeader>
                <CardTitle>Invite by exact email</CardTitle>
                <CardDescription>
                  If you already know their login email, you can invite without searching.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={inviteByEmail} className="flex flex-col gap-3 sm:flex-row sm:items-end">
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="invite-email">Email</Label>
                    <Input
                      id="invite-email"
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="friend@university.edu"
                      className="h-11"
                      autoComplete="email"
                    />
                  </div>
                  <Button type="submit" className="h-11 shrink-0 gap-2" disabled={inviteBusy || !inviteEmail.trim()}>
                    {inviteBusy ? <Loader2 className="size-4 animate-spin" /> : <UserPlus className="size-4" />}
                    Send invite
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="rounded-xl border border-border shadow-sm">
              <CardHeader>
                <CardTitle>Incoming invites</CardTitle>
                <CardDescription>Accept or decline friend requests.</CardDescription>
              </CardHeader>
              <CardContent>
                {incoming.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No pending invites.</p>
                ) : (
                  <ul className="space-y-2">
                    {incoming.map((inv) => (
                      <li
                        key={inv.id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 py-3 text-sm"
                      >
                        <div>
                          <p className="font-medium">
                            {inv.user.firstName} {inv.user.lastName}
                          </p>
                          <p className="text-xs text-muted-foreground">{inv.user.email}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            size="sm"
                            className="gap-1"
                            disabled={rowBusy === inv.id}
                            onClick={() => void acceptInvite(inv.id)}
                          >
                            {rowBusy === inv.id ? (
                              <Loader2 className="size-3.5 animate-spin" />
                            ) : (
                              <Check className="size-3.5" />
                            )}
                            Accept
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="gap-1"
                            disabled={rowBusy === inv.id}
                            onClick={() => void declineInvite(inv.id)}
                          >
                            <X className="size-3.5" />
                            Decline
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-xl border border-border shadow-sm">
              <CardHeader>
                <CardTitle>Sent invites</CardTitle>
                <CardDescription>Waiting for them to accept. You can cancel a request.</CardDescription>
              </CardHeader>
              <CardContent>
                {outgoing.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No outgoing invites.</p>
                ) : (
                  <ul className="space-y-2">
                    {outgoing.map((inv) => (
                      <li
                        key={inv.id}
                        className={cn(
                          "flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-3 py-3 text-sm",
                          "bg-card",
                        )}
                      >
                        <div>
                          <p className="font-medium">
                            {inv.user.firstName} {inv.user.lastName}
                          </p>
                          <p className="text-xs text-muted-foreground">{inv.user.email}</p>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="text-muted-foreground"
                          disabled={rowBusy === inv.id}
                          onClick={() => void cancelOutgoing(inv.id)}
                        >
                          {rowBusy === inv.id ? <Loader2 className="size-3.5 animate-spin" /> : "Cancel"}
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-xl border border-border shadow-sm">
              <CardHeader>
                <CardTitle>Your friends</CardTitle>
                <CardDescription>Everyone you have connected with.</CardDescription>
              </CardHeader>
              <CardContent>
                {friends.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No friends yet — search or invite someone above.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {friends.map((f) => (
                      <li
                        key={f.inviteId}
                        className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-3 text-sm"
                      >
                        <div>
                          <p className="font-medium">
                            {f.user.firstName} {f.user.lastName}
                          </p>
                          <p className="text-xs text-muted-foreground">{f.user.email}</p>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          Since {new Date(f.since).toLocaleDateString()}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <p className="text-center text-sm text-muted-foreground">
              <Button variant="link" asChild className="h-auto p-0">
                <Link href="/dashboard">Back to dashboard</Link>
              </Button>
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

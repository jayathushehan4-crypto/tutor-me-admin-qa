"use client";

import { Button } from "@/components/ui/button/Button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useLazyFetchRewardsForReferrerQuery } from "@/store/api/splits/referrals";
import {
  useClearUserReferralCodeMutation,
  useFetchUsersQuery,
  useUpdateUserMutation,
} from "@/store/api/splits/users";
import { Users } from "@/types/response-types";
import { getErrorInApiResult } from "@/utils/api";
import { AlertTriangle, Copy, Loader2, SquarePen, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { ViewUserAsReferee } from "./ViewUserAsReferee";
import { useFetchReferralsSummaryQuery } from "@/store/api/splits/referrals";

const LIMIT = 20;
const TH =
  "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400";

// ── Helpers ─────────────────────────────────────────────────────────────────

function referrerId(user: Users): string {
  // For tutors the referral rewards are keyed by the Tutor document's _id (tutorId),
  // for admins they're keyed by the User document's _id.
  return user.role === "tutor" && user.tutorId ? user.tutorId : user.id;
}

// ── Edit bank details dialog ─────────────────────────────────────────────────

type BankFormValues = {
  accountName: string;
  accountNumber: string;
  bankName: string;
};

function EditBankDetails({ user }: { user: Users }) {
  const [open, setOpen] = useState(false);
  const [updateUser, { isLoading }] = useUpdateUserMutation();

  const { register, handleSubmit, reset } = useForm<BankFormValues>({
    defaultValues: {
      accountName: user.accountName ?? "",
      accountNumber: user.accountNumber ?? "",
      bankName: user.bankName ?? "",
    },
  });

  const handleOpen = () => {
    reset({
      accountName: user.accountName ?? "",
      accountNumber: user.accountNumber ?? "",
      bankName: user.bankName ?? "",
    });
    setOpen(true);
  };

  const onSubmit = async (data: BankFormValues) => {
    const result = await updateUser({
      id: user.id,
      accountName: data.accountName.trim() || null,
      accountNumber: data.accountNumber.trim() || null,
      bankName: data.bankName.trim() || null,
    });
    const error = getErrorInApiResult(result);
    if (error) {
      toast.error(error);
      return;
    }
    toast.success("Bank details updated");
    setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        title="Edit bank details"
        onClick={handleOpen}
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-blue-500 transition-colors hover:bg-blue-50 hover:text-blue-700 dark:text-blue-400 dark:hover:bg-blue-500/10 dark:hover:text-blue-300"
      >
        <SquarePen className="h-4 w-4" />
      </button>

      <Dialog open={open} onOpenChange={(o) => !o && setOpen(false)}>
        <DialogContent className="sm:max-w-[500px] bg-white dark:bg-gray-800 dark:text-white/90 p-0 overflow-hidden [&>div:last-child]:flex [&>div:last-child]:min-h-0 [&>div:last-child]:flex-col [&>div:last-child]:overflow-hidden [&>div:last-child]:p-0">
          <DialogHeader className="shrink-0 bg-white dark:bg-gray-800 px-6 py-4 border-b">
            <DialogTitle>Edit Referee Details</DialogTitle>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {user.name} ·{" "}
              <span className="capitalize">{user.role}</span>
            </p>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="min-h-0 flex-1 overflow-y-auto scrollbar-thin px-6 py-6 space-y-5">
              {/* Read-only fields */}
              <div className="space-y-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                  Referee Information (read-only)
                </p>
                {[
                  { label: "Name", value: user.name },
                  { label: "Email", value: user.email },
                  { label: "Contact Number", value: user.phoneNumber || "—" },
                  {
                    label: "Gender",
                    value: user.gender
                      ? user.gender.charAt(0).toUpperCase() +
                        user.gender.slice(1)
                      : "—",
                  },
                  {
                    label: "Role",
                    value: user.role
                      ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
                      : "—",
                  },
                  { label: "Referral Code", value: user.referralCode || "—" },
                ].map(({ label, value }) => (
                  <div key={label} className="space-y-1.5">
                    <Label className="text-xs text-gray-500">{label}</Label>
                    <Input
                      value={value}
                      disabled
                      readOnly
                      className="cursor-not-allowed bg-gray-50 dark:bg-gray-700 text-gray-500"
                    />
                  </div>
                ))}
              </div>

              {/* Editable bank details */}
              <div className="space-y-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                  Bank Details (editable)
                </p>
                <div className="space-y-2">
                  <Label htmlFor="accountName">Account Name</Label>
                  <Input
                    id="accountName"
                    placeholder="e.g. Nimal Perera"
                    {...register("accountName")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accountNumber">Account Number</Label>
                  <Input
                    id="accountNumber"
                    placeholder="e.g. 0012345678"
                    {...register("accountNumber")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bankName">Bank Name</Label>
                  <Input
                    id="bankName"
                    placeholder="e.g. Commercial Bank of Ceylon"
                    {...register("bankName")}
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="shrink-0 bg-white dark:bg-gray-800 px-6 py-4 border-t">
              <DialogClose asChild>
                <Button variant="outline" type="button">
                  Cancel
                </Button>
              </DialogClose>
              <Button
                type="submit"
                className="bg-blue-700 text-white hover:bg-blue-500"
                isLoading={isLoading}
              >
                Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ── Delete (revoke referral code) dialog ─────────────────────────────────────

type DeleteStep = "idle" | "checking" | "warn" | "confirm";

function RevokeReferralCode({
  user,
  pendingRewards,
}: {
  user: Users;
  pendingRewards: number;
}) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<DeleteStep>("idle");

  const [clearCode, { isLoading }] = useClearUserReferralCodeMutation();
  const [fetchRewards] = useLazyFetchRewardsForReferrerQuery();

  const close = () => {
    setOpen(false);
    setStep("idle");
  };

  const handleTriggerClick = async () => {
    // Use the pre-fetched pendingRewards count from summaries if available
    if (pendingRewards > 0) {
      setStep("warn");
      setOpen(true);
      return;
    }
    // Double-check via the rewards API for accuracy
    setStep("checking");
    setOpen(true);
    try {
      const rid = referrerId(user);
      const result = await fetchRewards(
        { tutorId: rid, unsentOnly: true },
        true,
      ).unwrap();
      const count = result.results?.length ?? 0;
      if (count > 0) {
        setStep("warn");
      } else {
        setStep("confirm");
      }
    } catch {
      setStep("confirm");
    }
  };

  const handleRevoke = async () => {
    const result = await clearCode(user.id);
    const error = getErrorInApiResult(result);
    if (error) {
      toast.error(error);
      return;
    }
    toast.success(
      `Referral code revoked for ${user.name}. Send Code is now available again.`,
    );
    close();
  };

  return (
    <>
      <button
        type="button"
        title="Revoke referral code"
        onClick={handleTriggerClick}
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-red-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-red-400 dark:hover:bg-red-500/10 dark:hover:text-red-300"
      >
        <Trash2 className="h-4 w-4" />
      </button>

      <Dialog open={open} onOpenChange={(o) => !o && close()}>
        <DialogContent className="sm:max-w-[460px] bg-white dark:bg-gray-800 dark:text-white/90">
          <DialogHeader>
            {step === "checking" ? (
              <DialogTitle>Checking pending rewards…</DialogTitle>
            ) : step === "warn" ? (
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5 w-9 h-9 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <DialogTitle className="text-base pt-1">
                  Pending Rewards — Action Required
                </DialogTitle>
              </div>
            ) : (
              <DialogTitle>Revoke Referral Code</DialogTitle>
            )}
          </DialogHeader>

          {step === "checking" && (
            <div className="flex justify-center py-4">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          )}

          {step === "warn" && (
            <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
              <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 px-4 py-3">
                <p className="font-semibold text-amber-800 dark:text-amber-300">
                  {pendingRewards > 0 ? pendingRewards : "Unsettled"} pending
                  reward{pendingRewards !== 1 ? "s" : ""} tied to{" "}
                  <strong>{user.name}</strong>
                </p>
                <p className="mt-1 text-amber-700 dark:text-amber-400">
                  Please go to the <strong>Referrals</strong> page and settle
                  all pending rewards before revoking this referral code.
                  Revoking without settling may result in lost reward records.
                </p>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                If you have already settled all rewards, you may proceed.
              </p>
            </div>
          )}

          {step === "confirm" && (
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Are you sure you want to revoke the referral code for{" "}
              <strong>{user.name}</strong>? The Send Code option will become
              available again in the Users page. This action cannot be undone.
            </p>
          )}

          {(step === "warn" || step === "confirm") && (
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" onClick={close}>
                  Cancel
                </Button>
              </DialogClose>
              <Button
                type="button"
                className="bg-red-600 text-white hover:bg-red-500"
                isLoading={isLoading}
                onClick={handleRevoke}
              >
                {step === "warn"
                  ? "I have settled rewards — Revoke"
                  : "Revoke Code"}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

// ── Main tab component ────────────────────────────────────────────────────────

export function RegisteredUsersTab() {
  const [page, setPage] = useState(1);

  const { data, isFetching } = useFetchUsersQuery({
    page,
    limit: LIMIT,
    roles: "tutor,admin",
    hasReferralCode: "true",
    sortBy: "name:asc",
  });

  const { data: summariesData } = useFetchReferralsSummaryQuery({
    page: 1,
    limit: 1000,
  });

  // Build lookup maps from referral summaries
  const { countMap, pendingMap } = useMemo(() => {
    const countMap = new Map<string, number>();
    const pendingMap = new Map<string, number>();
    summariesData?.results.forEach((s) => {
      countMap.set(s.referrerTutorId, s.totalReferrals);
      pendingMap.set(s.referrerTutorId, s.pendingRewards);
    });
    return { countMap, pendingMap };
  }, [summariesData]);

  const getReferralCount = (user: Users) =>
    countMap.get(referrerId(user)) ?? 0;

  const getPendingRewards = (user: Users) =>
    pendingMap.get(referrerId(user)) ?? 0;

  const users = data?.results ?? [];
  const totalPages = data?.totalPages ?? 1;
  const totalResults = data?.totalResults ?? 0;

  const displayBank = (v?: string | null) =>
    v && v.trim() ? v : <span className="text-gray-400 italic">—</span>;

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      toast.success("Referral code copied!");
    });
  };

  return (
    <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
      {isFetching ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : users.length === 0 ? (
        <div className="py-16 text-center text-sm text-gray-400">
          No registered users with referral codes found.
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 dark:bg-white/5">
                  <th className={TH}>Name</th>
                  <th className={TH}>Email</th>
                  <th className={TH}>Contact Number</th>
                  <th className={TH}>Gender</th>
                  <th className={TH}>Referral Code</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Referral Count
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Actions
                  </th>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow
                    key={user.id}
                    className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                  >
                    <TableCell className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {user.name}
                      </p>
                    </TableCell>

                    <TableCell className="px-4 py-3">
                      <p className="text-xs text-gray-600 dark:text-gray-400 break-all">
                        {user.email}
                      </p>
                    </TableCell>

                    <TableCell className="px-4 py-3 whitespace-nowrap">
                      <p className="text-xs text-gray-700 dark:text-gray-300">
                        {user.phoneNumber || "—"}
                      </p>
                    </TableCell>

                    <TableCell className="px-4 py-3 whitespace-nowrap">
                      <p className="text-xs capitalize text-gray-700 dark:text-gray-300">
                        {user.gender || "—"}
                      </p>
                    </TableCell>

                    <TableCell className="px-4 py-3">
                      {user.referralCode ? (
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-sm text-gray-800 dark:text-gray-100 tracking-wider">
                            {user.referralCode}
                          </span>
                          <button
                            type="button"
                            title="Copy referral code"
                            onClick={() => copyCode(user.referralCode!)}
                            className="p-1 rounded text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic text-sm">
                          No code
                        </span>
                      )}
                    </TableCell>

                    <TableCell className="px-4 py-3 text-center">
                      <span className="inline-flex items-center justify-center h-7 min-w-[1.75rem] rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-semibold px-2">
                        {getReferralCount(user)}
                      </span>
                    </TableCell>

                    <TableCell className="px-4 py-3 text-center">
                      <div className="flex justify-center items-center gap-3">
                        {/* View */}
                        <ViewUserAsReferee
                          user={user}
                          referralCount={getReferralCount(user)}
                        />
                        {/* Edit (bank details only, rest read-only) */}
                        <EditBankDetails user={user} />
                        {/* Delete = revoke referral code */}
                        <RevokeReferralCode
                          user={user}
                          pendingRewards={getPendingRewards(user)}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500">
                {totalResults} user{totalResults !== 1 ? "s" : ""}
              </p>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 text-xs rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                >
                  Previous
                </button>
                <span className="px-3 py-1.5 text-xs text-gray-500">
                  {page} / {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 text-xs rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

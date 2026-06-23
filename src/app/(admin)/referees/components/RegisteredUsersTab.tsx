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
import {
  useFetchUsersQuery,
  useUpdateUserMutation,
} from "@/store/api/splits/users";
import { Users } from "@/types/response-types";
import { getErrorInApiResult } from "@/utils/api";
import { Loader2, SquarePen } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";

const LIMIT = 20;

// ── Bank details edit dialog ────────────────────────────────────────────────

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
        <DialogContent className="sm:max-w-[420px] bg-white dark:bg-gray-800 dark:text-white/90 p-0 overflow-hidden [&>div:last-child]:flex [&>div:last-child]:min-h-0 [&>div:last-child]:flex-col [&>div:last-child]:overflow-hidden [&>div:last-child]:p-0">
          <DialogHeader className="shrink-0 bg-white dark:bg-gray-800 px-6 py-4 border-b">
            <DialogTitle>Edit Bank Details</DialogTitle>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {user.name} · {user.role}
            </p>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="min-h-0 flex-1 overflow-y-auto scrollbar-thin px-6 py-6 space-y-5">
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

// ── Main tab component ──────────────────────────────────────────────────────

export function RegisteredUsersTab() {
  const [page, setPage] = useState(1);

  const { data, isFetching } = useFetchUsersQuery({
    page,
    limit: LIMIT,
    roles: "tutor,admin",
    hasReferralCode: "true",
    sortBy: "name:asc",
  });

  const users = data?.results ?? [];
  const totalPages = data?.totalPages ?? 1;
  const totalResults = data?.totalResults ?? 0;

  const displayBank = (v?: string | null) =>
    v && v.trim() ? v : <span className="text-gray-400 italic">—</span>;

  const roleLabel = (role: string) =>
    role.charAt(0).toUpperCase() + role.slice(1);

  return (
    <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
      {isFetching ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : users.length === 0 ? (
        <div className="py-16 text-center text-sm text-gray-400">
          No registered users found.
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 dark:bg-white/5">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Role
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Contact Number
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Gender
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Referral Code
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Account Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Account Number
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Bank Name
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Edit Bank
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

                    <TableCell className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${
                          user.role === "admin"
                            ? "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/40 dark:text-purple-300 dark:border-purple-700"
                            : "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-700"
                        }`}
                      >
                        {roleLabel(user.role)}
                      </span>
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
                        <span className="font-mono text-sm text-gray-800 dark:text-gray-100 tracking-wider">
                          {user.referralCode}
                        </span>
                      ) : (
                        <span className="text-gray-400 italic text-sm">
                          No code
                        </span>
                      )}
                    </TableCell>

                    <TableCell className="px-4 py-3">
                      <p className="text-xs text-gray-700 dark:text-gray-300">
                        {displayBank(user.accountName)}
                      </p>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <p className="text-xs font-mono text-gray-700 dark:text-gray-300">
                        {displayBank(user.accountNumber)}
                      </p>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <p className="text-xs text-gray-700 dark:text-gray-300">
                        {displayBank(user.bankName)}
                      </p>
                    </TableCell>

                    <TableCell className="px-4 py-3 text-center">
                      <div className="flex justify-center">
                        <EditBankDetails user={user} />
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

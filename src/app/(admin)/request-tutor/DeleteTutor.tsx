"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  useDeleteRequestForTutorMutation,
  useFetchRequestForTutorsQuery,
} from "@/store/api/splits/request-tutor";
import { getErrorInApiResult } from "@/utils/api";
import { Trash2 } from "lucide-react";
import toast from "react-hot-toast";

interface DeleteTutorRequestProps {
  tutorId: string;
}

export function DeleteTutorRequest({ tutorId }: DeleteTutorRequestProps) {
  const [deleteTutorRequest, { isLoading }] =
    useDeleteRequestForTutorMutation();
  const { refetch } = useFetchRequestForTutorsQuery({});
  const handleDelete = async () => {
    try {
      const result = await deleteTutorRequest(tutorId);
      refetch();
      if ("error" in result && result.error) {
        const error = getErrorInApiResult({ error: result.error });
        toast.error(error);
      } else {
        toast.success("Tutor request deleted successfully");
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        toast.error(err.message || "Failed to delete tutor request");
      } else {
        toast.error("Failed to delete tutor requests");
      }
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Trash2 className="cursor-pointer text-red-500 hover:text-red-600" />
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete this
            tutor request.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isLoading}
            className="bg-red-500 text-white hover:bg-red-600"
          >
            {isLoading ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

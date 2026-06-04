"use client";

import DataTable from "@/components/tables/DataTable";
import {
  useDeleteAssignmentMutation,
  useFetchAssignmentsQuery,
} from "@/store/api/splits/tuition-assignments";
import { useState } from "react";
import { DeleteAssignment } from "./DeleteAssignment";
import ViewDetails from "./ViewDetails";
import { UpdateAssignment } from "./edit-assignment/UpdateAssignment";

export default function AssignmentsList() {
  const [page, setPage] = useState(1);
  const [deleteAssignment] = useDeleteAssignmentMutation();
  const limit = 10;

  const { data, isLoading } = useFetchAssignmentsQuery({
    page,
    limit,
    sortBy: "updatedAt:desc",
  });

  const assignments = data?.results || [];
  const totalPages = data?.totalPages || 0;
  const totalResults = data?.totalResults || 0;

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const columns = [
    {
      key: "title",
      header: "Title",
      className:
        "min-w-[150px] max-w-[250px] truncate overflow-hidden sticky left-0 z-20 bg-white dark:bg-gray-900",
      render: (row: { title: string }) => (
        <span
          title={row.title}
          className="truncate block"
          style={{ width: "inherit" }}
        >
          {row.title}
        </span>
      ),
    },
    { key: "assignmentNumber", header: "Assignment Number" },
    { key: "address", header: "Address" },
    { key: "duration", header: "Duration" },
    { key: "assignmentPrice", header: "Price" },
    {
      key: "createdAt",
      header: "Created Date",
      bodyClassName: "text-[0.75rem] font-mono",
      render: (row: { createdAt: string }) => {
        try {
          const date = new Date(row.createdAt);
          if (isNaN(date.getTime())) {
            return <span className="text-gray-400 italic">Invalid date</span>;
          }
          return date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          });
        } catch (error) {
          console.error("Error parsing date:", error);
          return <span className="text-gray-400 italic">Invalid date</span>;
        }
      },
    },
    {
      key: "view",
      header: "View",
      className:
        "min-w-[80px] max-w-[80px] sticky right-[160px] z-20 bg-white dark:bg-gray-900",
      render: (row: {
        title: string;
        assignmentNumber: string;
        address: string;
        duration: string;
        assignmentPrice: string;
      }) => (
        <div className="w-full flex justify-center items-center">
          <ViewDetails assignment={row} />
        </div>
      ),
    },
    {
      key: "edit",
      header: "Edit",
      className:
        "min-w-[80px] max-w-[80px] sticky right-[80px] z-20 bg-white dark:bg-gray-900",
      render: (row: {
        id: string;
        title: string;
        assignmentNumber: string;
        address: string;
        duration: string;
        assignmentPrice: string;
      }) => (
        <div className="w-full flex justify-center items-center">
          <UpdateAssignment id={row.id} />
        </div>
      ),
    },
    {
      key: "delete",
      header: "Delete",
      className:
        "min-w-[80px] max-w-[80px] sticky right-0 z-20 bg-white dark:bg-gray-900",
      render: (row: { id: string }) => (
        <div className="w-full flex justify-center items-center">
          <DeleteAssignment assignmentId={row.id} />
        </div>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={assignments}
      page={page}
      totalPages={totalPages}
      onPageChange={handlePageChange}
      totalResults={totalResults}
      limit={limit}
      isLoading={isLoading}
      bulkDelete={{
        entityName: "assignment",
        deleteRow: (row) => deleteAssignment(String(row.id)).unwrap(),
      }}
    />
  );
}

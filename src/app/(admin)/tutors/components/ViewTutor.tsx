/* eslint-disable @typescript-eslint/no-explicit-any, @next/next/no-img-element */
"use client";

import { formatYearsExperience } from "@/app/(admin)/tutors/constants";
import { TUTOR_STATUS_STYLE_CLASSES } from "@/configs/app-constants";
import { Button } from "@/components/ui/button/Button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useFetchGradesQuery } from "@/store/api/splits/grades";
import { Copy, Eye } from "lucide-react";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";

type ArrayItem =
  | string
  | number
  | null
  | undefined
  | { id?: string; title?: string; name?: string };

interface Grade {
  id: string;
  title: string;
  subjects?: { id: string; title: string }[];
}

interface CertificateItem {
  id?: string;
  type: string;
  url: string;
}

interface ViewTutorProps {
  tutor: {
    fullName?: string;
    email?: string;
    contactNumber?: string;
    dateOfBirth?: string;
    gender?: string;
    age?: number;
    nationality?: string;
    race?: string;
    status?: string;
    classType?: string[];

    tutorType?: string[];
    yearsExperience?: number;
    highestEducation?: string;
    academicDetails?: string;
    teachingSummary?: string;
    studentResults?: string;
    sellingPoints?: string;
    preferredLocations?: string[] | { id?: string; title?: string }[];
    agreeTerms?: boolean;
    agreeAssignmentInfo?: boolean;
    createdAt?: string;
    updatedAt?: string;
    tutorMediums?: string[] | { id?: string; title?: string }[];
    grades?: string[] | { id?: string; title?: string }[];
    subjects?: string[] | { id?: string; title?: string }[];
    certificatesAndQualifications?: CertificateItem[] | string[];
  };
}

function CopyableDisplayField({
  label,
  value,
  className,
}: {
  label: string;
  value?: string | number | null;
  className: string;
}) {
  const copyValue = String(value ?? "").trim();
  const canCopy = Boolean(copyValue);

  const handleCopy = async () => {
    if (!canCopy) return;

    try {
      await navigator.clipboard.writeText(copyValue);
      toast.success(`${label} copied to clipboard`);
    } catch (error) {
      console.error(`Failed to copy ${label}:`, error);
      toast.error(`Failed to copy ${label.toLowerCase()}`);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      disabled={!canCopy}
      aria-label={canCopy ? `Copy ${label}` : undefined}
      title={canCopy ? `Click to copy ${label.toLowerCase()}` : undefined}
      className={`${className} group flex items-center justify-between gap-3 text-left ${
        canCopy ? "cursor-pointer" : "cursor-default"
      }`}
    >
      <span className="min-w-0 flex-1 truncate">{copyValue || "N/A"}</span>
      {canCopy && (
        <>
          <span className="shrink-0 text-gray-400 opacity-0 duration-300 group-hover:opacity-100">
            ( Click to copy )
          </span>
          <Copy className="h-4 w-4 shrink-0 text-gray-700 opacity-50 duration-300 group-hover:opacity-100 dark:text-gray-300" />
        </>
      )}
    </button>
  );
}

function CertificateViewer({
  url,
  isOpen,
  onClose,
}: {
  url: string | null;
  isOpen: boolean;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(true);

  if (!url) return null;

  const isPdf = url.toLowerCase().endsWith(".pdf");

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="sm:max-w-[800px] max-h-[90vh] h-[80vh] flex flex-col"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Certificate Viewer</DialogTitle>
        </DialogHeader>
        <div className="flex-1 relative w-full h-full bg-gray-100 rounded-md overflow-hidden flex items-center justify-center">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center z-10 bg-gray-100/50">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
          {isPdf ? (
            <iframe
              src={url}
              className="w-full h-full"
              onLoad={() => setLoading(false)}
              title="Certificate PDF"
            />
          ) : (
            <img
              src={url}
              alt="Certificate"
              className="max-w-full max-h-full object-contain"
              onLoad={() => setLoading(false)}
            />
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ViewTutor({ tutor }: ViewTutorProps) {
  const [open, setOpen] = useState(false);
  const [selectedCert, setSelectedCert] = useState<string | null>(null);

  const displayFieldClass =
    "w-full rounded-md border border-gray-200 bg-gray-50 py-2.5 px-3 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-700 dark:text-white/90 min-h-[2rem] overflow-auto scrollbar-thin";

  const tagClass =
    "inline-block bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 text-xs font-medium mr-1 mb-1 px-2 py-1 rounded";

  const getSafeValue = (
    value: string | number | undefined | null,
    fallback = "N/A",
  ) =>
    value === undefined ||
    value === null ||
    (typeof value === "string" && value.trim() === "")
      ? fallback
      : value;

  const normalizeArrayToStrings = (arr?: ArrayItem[]) => {
    if (!arr || !Array.isArray(arr)) return [];
    return arr.map((it) => {
      if (typeof it === "string") return it;
      if (typeof it === "number") return String(it);
      if (it == null) return "N/A";
      return it.title ?? it.name ?? it.id ?? JSON.stringify(it);
    });
  };

  const mediumList = normalizeArrayToStrings(tutor.tutorMediums);
  const locations = normalizeArrayToStrings(tutor.preferredLocations);
  const classTypeList: string[] = tutor.classType || [];

  // Normalize certificates: support both old string[] and new {type, url}[]
  const certificates: CertificateItem[] = useMemo(() => {
    const raw = (tutor as any).certificatesAndQualifications;
    if (!Array.isArray(raw)) return [];
    return raw.map((item: any) => {
      if (typeof item === "string") return { type: "Certificate", url: item };
      return { type: item.type || "Certificate", url: item.url || "" };
    });
  }, [tutor]);

  const { data: gradesData } = useFetchGradesQuery({ page: 1, limit: 200 });

  const { gradeIdToTitle, subjectIdToTitle } = useMemo(() => {
    const gradeMap = new Map<string, string>();
    const subjectMap = new Map<string, string>();

    const grades = (gradesData?.results as unknown as Grade[]) ?? [];
    for (const g of grades) {
      if (g?.id) gradeMap.set(g.id, g.title ?? String(g.id));
      if (Array.isArray(g.subjects)) {
        g.subjects.forEach((s) => {
          if (s?.id) subjectMap.set(s.id, s.title ?? s.id);
        });
      }
    }
    return {
      gradeIdToTitle: gradeMap,
      subjectIdToTitle: subjectMap,
    };
  }, [gradesData]);

  const gradeList = useMemo(() => {
    if (!tutor?.grades || !Array.isArray(tutor.grades)) return [];
    return tutor.grades.map((g) => {
      if (typeof g === "string") {
        return gradeIdToTitle.get(g) ?? g;
      }
      if (typeof g === "object" && g != null) {
        if ("title" in g)
          return (g as Grade).title ?? (g as Grade).id ?? String(g);
        if ("id" in g) return (g as Grade).id ?? String(g);
        return String(g);
      }
      return String(g);
    });
  }, [tutor?.grades, gradeIdToTitle]);

  const subjectList = useMemo(() => {
    if (!tutor?.subjects || !Array.isArray(tutor.subjects)) return [];
    return tutor.subjects.map((s) => {
      if (typeof s === "string") {
        const fromMap = subjectIdToTitle.get(s);
        if (fromMap) return fromMap;
        for (const g of (gradesData?.results as unknown as Grade[]) ?? []) {
          const found = g.subjects?.find((sub) => sub.id === s);
          if (found) return found.title ?? found.id ?? String(s);
        }
        return s;
      }
      if (typeof s === "object" && s != null) {
        const sObj = s as { id?: string; title?: string };
        return sObj.title ?? sObj.id ?? String(s);
      }
      return String(s);
    });
  }, [tutor?.subjects, subjectIdToTitle, gradesData]);

  const statusKey = (tutor.status || "").toLowerCase();
  const statusStyle =
    TUTOR_STATUS_STYLE_CLASSES[statusKey] ||
    TUTOR_STATUS_STYLE_CLASSES["pending"];

  return (
    <>
      <CertificateViewer
        url={selectedCert}
        isOpen={!!selectedCert}
        onClose={() => setSelectedCert(null)}
      />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Eye className="cursor-pointer text-blue-500 hover:text-blue-700" />
        </DialogTrigger>

        <DialogContent className="sm:max-w-[625px] bg-white dark:bg-gray-800 dark:text-white/90 p-0 overflow-hidden [&>div:last-child]:flex [&>div:last-child]:min-h-0 [&>div:last-child]:flex-col [&>div:last-child]:overflow-hidden [&>div:last-child]:p-0">
          <DialogHeader className="shrink-0 bg-white dark:bg-gray-800 px-6 py-4 border-b">
            <DialogTitle>Tutor Details</DialogTitle>
          </DialogHeader>

          <div className="min-h-0 flex-1 overflow-y-auto scrollbar-thin px-6 py-6">
            <div className="grid gap-4">
              {/** Status */}
              {tutor.status && (
                <div className="grid gap-3">
                  <Label>Status</Label>
                  <div>
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold capitalize ${statusStyle}`}
                    >
                      {tutor.status}
                    </span>
                  </div>
                </div>
              )}

              {/** General Info */}
              <div className="grid gap-3">
                <Label>Full Name</Label>
                <CopyableDisplayField
                  label="Full Name"
                  value={tutor.fullName}
                  className={displayFieldClass}
                />
              </div>
              <div className="grid gap-3">
                <Label>Email</Label>
                <CopyableDisplayField
                  label="Email"
                  value={tutor.email}
                  className={displayFieldClass}
                />
              </div>
              <div className="grid gap-3">
                <Label>Contact Number</Label>
                <CopyableDisplayField
                  label="Contact Number"
                  value={tutor.contactNumber}
                  className={displayFieldClass}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-3">
                  <Label>Date of Birth</Label>
                  <div className={displayFieldClass}>
                    {tutor.dateOfBirth
                      ? new Date(tutor.dateOfBirth)
                          .toLocaleDateString("en-CA")
                          .replace(/-/g, "/")
                      : "N/A"}
                  </div>
                </div>
                <div className="grid gap-3">
                  <Label>Gender</Label>
                  <div className={displayFieldClass}>
                    {getSafeValue(tutor.gender)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-3">
                  <Label>Age</Label>
                  <div className={displayFieldClass}>
                    {getSafeValue(tutor.age)}
                  </div>
                </div>
                <div className="grid gap-3">
                  <Label>Nationality</Label>
                  <div className={displayFieldClass}>
                    {getSafeValue(tutor.nationality)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-3">
                  <Label>Race</Label>
                  <div className={displayFieldClass}>
                    {getSafeValue(tutor.race)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-3">
                  <Label>Tutor Type</Label>
                  <div className={displayFieldClass}>
                    {Array.isArray(tutor.tutorType)
                      ? tutor.tutorType.join(", ")
                      : getSafeValue(tutor.tutorType)}
                  </div>
                </div>
                <div className="grid gap-3">
                  <Label>Years of Experience</Label>
                  <div className={displayFieldClass}>
                    {(() => {
                      const formatted = formatYearsExperience(
                        tutor.yearsExperience,
                      );
                      return formatted === "" ? "N/A" : formatted;
                    })()}
                  </div>
                </div>
              </div>

              <div className="grid gap-3">
                <Label>Class Type</Label>
                <div className="flex flex-wrap">
                  {classTypeList.length === 0 ? (
                    <span className={tagClass}>N/A</span>
                  ) : (
                    classTypeList.map((ct, i) => (
                      <span key={i} className={tagClass}>
                        {ct}
                      </span>
                    ))
                  )}
                </div>
              </div>

              <div className="grid gap-3">
                <Label>Highest Education</Label>
                <div className={displayFieldClass}>
                  {getSafeValue(tutor.highestEducation)}
                </div>
              </div>

              <div className="grid gap-3">
                <Label>Academic Details</Label>
                <div className={displayFieldClass}>
                  {getSafeValue(tutor.academicDetails)}
                </div>
              </div>

              <div className="grid gap-3">
                <Label>Teaching Summary</Label>
                <div className={displayFieldClass}>
                  {getSafeValue(tutor.teachingSummary)}
                </div>
              </div>

              <div className="grid gap-3">
                <Label>Student Results</Label>
                <div className={displayFieldClass}>
                  {getSafeValue(tutor.studentResults)}
                </div>
              </div>

              <div className="grid gap-3">
                <Label>Selling Points</Label>
                <div className={displayFieldClass}>
                  {getSafeValue(tutor.sellingPoints)}
                </div>
              </div>

              <div className="grid gap-3">
                <Label>Tutor Mediums</Label>
                <div className="flex flex-wrap">
                  {mediumList.length === 0 ? (
                    <span className={tagClass}>N/A</span>
                  ) : (
                    mediumList.map((m, i) => (
                      <span key={i} className={tagClass}>
                        {m}
                      </span>
                    ))
                  )}
                </div>
              </div>

              <div className="grid gap-3">
                <Label>Grades</Label>
                <div className="flex flex-wrap">
                  {gradeList.length === 0 ? (
                    <span className={tagClass}>N/A</span>
                  ) : (
                    gradeList.map((g, i) => (
                      <span key={i} className={tagClass}>
                        {g}
                      </span>
                    ))
                  )}
                </div>
              </div>

              <div className="grid gap-3">
                <Label>Subjects</Label>
                <div className="flex flex-wrap">
                  {subjectList.length === 0 ? (
                    <span className={tagClass}>N/A</span>
                  ) : (
                    subjectList.map((s, i) => (
                      <span key={i} className={tagClass}>
                        {s}
                      </span>
                    ))
                  )}
                </div>
              </div>

              <div className="grid gap-3">
                <Label>Preferred Locations</Label>
                <div className="flex flex-wrap">
                  {locations.length === 0 ? (
                    <span className={tagClass}>N/A</span>
                  ) : (
                    locations.map((loc, idx) => (
                      <span key={idx} className={tagClass}>
                        {loc}
                      </span>
                    ))
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-3">
                  <Label>Agree to Terms</Label>
                  <div className={displayFieldClass}>
                    {tutor.agreeTerms ? "Yes" : "No"}
                  </div>
                </div>
                <div className="grid gap-3">
                  <Label>Agree Assignment Info</Label>
                  <div className={displayFieldClass}>
                    {tutor.agreeAssignmentInfo ? "Yes" : "No"}
                  </div>
                </div>
              </div>

              <div className="grid gap-3">
                <Label>Certificates & Qualifications</Label>
                <div className="flex flex-wrap gap-2">
                  {certificates.length === 0 ? (
                    <div className={displayFieldClass}>N/A</div>
                  ) : (
                    certificates.map((cert, idx) => (
                      <Button
                        key={idx}
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedCert(cert.url)}
                        className="flex items-center gap-1"
                      >
                        <span className="text-xs font-medium text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                          {cert.type}
                        </span>
                        <span>View</span>
                      </Button>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="shrink-0 bg-white dark:bg-gray-800 px-6 py-4 border-t">
            <DialogClose asChild>
              <Button variant="outline">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

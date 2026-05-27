"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { XIcon } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

function Dialog({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />;
}

function DialogTrigger({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}

function DialogPortal({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />;
}

function DialogClose({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />;
}

function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50 backdrop-blur-[1px]",
        className,
        "z-[900000]",
      )}
      {...props}
    />
  );
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  showCloseButton?: boolean;
}) {
  return (
    <DialogPrimitive.Portal>
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(
          "bg-white text-gray-900 dark:bg-gray-800 dark:text-white/90 data-[state=open]:animate-in data-[state=closed]:animate-out " +
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 " +
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 " +
            "fixed top-[50%] left-[50%] z-50 flex w-full max-w-[calc(100%-2rem)] " +
            "translate-x-[-50%] translate-y-[-50%] flex-col rounded-lg border shadow-lg duration-200 " +
            "border-gray-200 dark:border-gray-700 sm:w-auto sm:min-w-[450px] sm:max-w-[700px] max-h-[80vh]",
          className,
          "z-[900001]",
        )}
        {...props}
      >
        {showCloseButton && (
          <div className="sticky top-0 z-25 px-6 pt-4 pb-3 ">
            <DialogPrimitive.Close
              data-slot="dialog-close"
              className="absolute top-4 right-4 inline-flex h-7 w-7 items-center justify-center rounded-md border border-gray-300 bg-white/70 text-gray-500 opacity-90 transition hover:bg-gray-100 hover:text-gray-700 focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-700/70 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white [&_svg]:size-4"
            >
              <XIcon />
              <span className="sr-only">Close</span>
            </DialogPrimitive.Close>
          </div>
        )}
        <div className="flex-1 overflow-y-auto px-6 pb-5 scrollbar-thin">
          {children}
        </div>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn(
        "sticky top-0 z-20 flex flex-col gap-2 bg-white pb-3 text-center dark:bg-gray-800 sm:text-left",
        className,
      )}
      {...props}
    />
  );
}

function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "flex flex-col-reverse gap-3 sm:flex-row sm:justify-end mt-4",
        className,
      )}
      {...props}
    />
  );
}

function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn(
        "text-lg font-semibold leading-none text-gray-900 dark:text-white",
        className,
      )}
      {...props}
    />
  );
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn("text-sm text-gray-500 dark:text-gray-400", className)}
      {...props}
    />
  );
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
};

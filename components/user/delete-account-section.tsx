"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useClerk } from "@clerk/nextjs"
import { useAction } from "convex/react"
import { useMutation } from "@tanstack/react-query"
import { CircleNotch, Trash, Warning } from "@phosphor-icons/react"
import { toast } from "sonner"
import { ConvexError } from "convex/values"
import { api } from "@/convex/_generated/api"
import { Card, CardContent } from "../ui/card"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../ui/alert-dialog"

const CONFIRM_WORD = "DELETE"

function DeleteAccountSection() {
  const [confirmText, setConfirmText] = useState("")
  const { signOut } = useClerk()
  const router = useRouter()

  const deleteAccountAction = useAction(api.account.deleteAccount)

  const { mutate: handleDelete, isPending } = useMutation({
    mutationFn: () => deleteAccountAction({}),
    onSuccess: async () => {
      await signOut()
      router.push("/")
      toast.success("Your account has been deleted.")
    },
    onError: (error) => {
      if (error instanceof ConvexError) {
        toast.error((error.data as string) || "Something went wrong. Please try again.")
      } else if (error instanceof Error) {
        toast.error(error.message)
      } else {
        toast.error("Something went wrong. Please try again.")
      }
    },
  })

  const isConfirmed = confirmText === CONFIRM_WORD

  return (
    <Card className="rounded-2xl ring-1 ring-destructive/15 shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
      <CardContent>
        <div className="flex items-start justify-between gap-6 flex-col sm:flex-row sm:items-center">
          <div className="space-y-1">
            <p className="text-[11px] uppercase font-semibold text-destructive tracking-widest">
              Danger Zone
            </p>
            <p className="text-sm text-foreground font-medium">Delete your account</p>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-md">
              Cancels any upcoming bookings and removes your personal details permanently.
              This can&apos;t be undone.
            </p>
          </div>

          <AlertDialog
            onOpenChange={(nextOpen) => {
              if (!nextOpen) setConfirmText("")
            }}
          >
            <AlertDialogTrigger
              render={
                <Button
                  variant="destructive"
                  size="lg"
                  className="shrink-0 rounded-full transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98]"
                />
              }
            >
              <Trash className="size-4" />
              Delete account
            </AlertDialogTrigger>

            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogMedia className="bg-destructive/10">
                  <Warning className="text-destructive" weight="fill" />
                </AlertDialogMedia>
                <AlertDialogTitle>Delete your account?</AlertDialogTitle>
                <AlertDialogDescription>
                  Any upcoming bookings will be cancelled and the businesses notified.
                  Your name, email, and phone number will be permanently removed — this
                  can&apos;t be undone. Past booking records are kept so businesses retain
                  their accounting history, but they&apos;ll no longer be linked to you.
                </AlertDialogDescription>
              </AlertDialogHeader>

              <div className="space-y-1.5">
                <label className="text-[11px] uppercase font-semibold text-muted-foreground tracking-widest mt-2">
                  Type {CONFIRM_WORD} to confirm
                </label>
                <Input
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder={CONFIRM_WORD}
                  autoComplete="off"
                  className="bg-transparent border-foreground/15"
                />
              </div>

              <AlertDialogFooter>
                <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  variant="destructive"
                  disabled={!isConfirmed || isPending}
                  onClick={() => handleDelete()}
                >
                  {isPending ? (
                    <CircleNotch className="size-4 animate-spin" />
                  ) : (
                    "Delete account"
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  )
}

export default DeleteAccountSection

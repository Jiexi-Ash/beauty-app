"use client"
import { Id } from '@/convex/_generated/dataModel'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { cn, getInitials } from '@/lib/utils'
import { ArrowRight, CircleNotch } from '@phosphor-icons/react'
import z from 'zod'
import { useForm } from '@tanstack/react-form'
import { Field, FieldGroup } from '../ui/field'
import { Label } from '../ui/label'
import { Input } from '../ui/input'
import { Card, CardContent } from '../ui/card'
import { Button } from '../ui/button'
import { useMutation } from '@tanstack/react-query'
import { useConvexMutation } from '@convex-dev/react-query'
import { api } from '@/convex/_generated/api'
import { toast } from 'sonner'
import { ConvexError } from 'convex/values'
import DeleteAccountSection from './delete-account-section'

type UserProfile = {
    _id: Id<"users">
    clerkId: string
    phone?: string
    email: string
    fullname: string
    image: string
}


const userSchema = z.object({
    fullName: z.string(),
    phoneNumber: z.string().min(10, "Phone number must be at least 10 digits"),
    emailAddress: z.string(),
})
interface UserProfileProps {
    profileDetails: {
        user: UserProfile,
        totalBookings: number,
        completedBookings: number,
        upcomingBookings: number
        cancelledBookings: number
    } | null
}

function UserProfile({ profileDetails }: UserProfileProps) {

    const { mutate: updatePhoneNumber, isPending } = useMutation({
        mutationFn: useConvexMutation(api.users.updateUserPhoneNumber),
        onSuccess: () => {
            toast.success("User phone number updated.");

        },
        onError: (error) => {
            if (error instanceof ConvexError) {
                toast.error(
                    error.data || "An unknown error occurred while updating user details.",
                );
            } else if (error instanceof Error) {
                toast.error(error.message);
            } else {
                toast.error("An unknown error occurred while updating user details.");
            }
        },
    });
    const form = useForm({
        defaultValues: {
            fullName: profileDetails?.user?.fullname ?? "",
            phoneNumber: profileDetails?.user?.phone ?? "",
            emailAddress: profileDetails?.user?.email ?? "",
        },

        validators: {
            onSubmit: userSchema
        },
        onSubmit: ({ value }) => {
            if (!value.phoneNumber) return
            updatePhoneNumber({ phoneNumber: value.phoneNumber })
        }
    })

    return (
        <div className="w-full h-full flex flex-col justify-center">
            <div className="my-10 space-y-8 max-w-2xl mx-auto">
                <div className="w-full flex flex-col items-center gap-4">
                    <div className="p-1.5 rounded-full bg-black/[0.04] ring-1 ring-black/5">
                        <Avatar size="xl" className="size-24 ring-4 ring-surface-container-lowest">
                            <AvatarImage src={profileDetails?.user?.image} alt="" />
                            <AvatarFallback className="font-headline text-lg">{getInitials(profileDetails?.user?.fullname ?? "")}</AvatarFallback>
                        </Avatar>
                    </div>
                    <div className="text-center space-y-0.5">
                        <h1 className="font-headline font-bold text-xl">{profileDetails?.user?.fullname || "Your profile"}</h1>
                        <p className="text-sm text-muted-foreground">{profileDetails?.user?.email}</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <StatCard value={profileDetails?.upcomingBookings ?? 0} label="Upcoming" accent />
                    <StatCard value={profileDetails?.completedBookings ?? 0} label="Completed" />
                    <StatCard value={profileDetails?.cancelledBookings ?? 0} label="Cancelled" />
                    <StatCard value={profileDetails?.totalBookings ?? 0} label="Total" />
                </div>

                <Card className="rounded-2xl ring-1 ring-black/5 shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
                    <CardContent>
                        <form className="space-y-4"
                            id="update-profile"
                            onSubmit={(e) => {
                                e.preventDefault();
                                form.handleSubmit();
                            }}
                        >
                            <FieldGroup>
                                <form.Field name="fullName">
                                    {(field) => {
                                        const isInvalid =
                                            field.state.meta.isTouched && !field.state.meta.isValid;
                                        return (
                                            <Field data-invalid={isInvalid}>
                                                <Label className="text-[11px] uppercase font-semibold text-muted-foreground tracking-widest">
                                                    Fullname
                                                </Label>
                                                <Input
                                                    value={field.state.value}
                                                    className="mt-1.5 bg-transparent border-foreground/15 rounded-xl h-12 text-sm"
                                                    onBlur={field.handleBlur}
                                                    readOnly
                                                    onChange={(e) => field.handleChange(e.target.value)}
                                                />
                                            </Field>
                                        )

                                    }}

                                </form.Field>

                                <form.Field name="emailAddress">
                                    {(field) => {
                                        const isInvalid =
                                            field.state.meta.isTouched && !field.state.meta.isValid;
                                        return (
                                            <Field data-invalid={isInvalid}>
                                                <Label className="text-[11px] uppercase font-semibold text-muted-foreground tracking-widest">
                                                    Email Address
                                                </Label>
                                                <Input
                                                    value={field.state.value}
                                                    className="mt-1.5 bg-transparent border-foreground/15 rounded-xl h-12 text-sm"
                                                    onBlur={field.handleBlur}
                                                    readOnly
                                                    onChange={(e) => field.handleChange(e.target.value)}
                                                />
                                            </Field>
                                        )

                                    }}

                                </form.Field>

                                <form.Field name="phoneNumber">
                                    {(field) => {
                                        const isInvalid =
                                            field.state.meta.isTouched && !field.state.meta.isValid;
                                        return (
                                            <Field data-invalid={isInvalid}>
                                                <Label className="text-[11px] uppercase font-semibold text-muted-foreground tracking-widest">
                                                    Phone Number
                                                </Label>
                                                <Input
                                                    value={field.state.value}
                                                    className="mt-1.5 bg-transparent border-foreground/15 rounded-xl h-12 text-sm"
                                                    onBlur={field.handleBlur}
                                                    onChange={(e) => field.handleChange(e.target.value)}
                                                />
                                            </Field>
                                        )

                                    }}

                                </form.Field>
                            </FieldGroup>

                            <p className="text-xs font-medium text-muted-foreground text-center">Only the phone number can be updated</p>
                            <Button size="lg"
                                className="group w-full rounded-full text-base py-6 bg-primary hover:bg-primary/90 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98]"
                                disabled={isPending}
                                type="submit">
                                {isPending ? (
                                    <CircleNotch className="text-white animate-spin size-4" />
                                ) : (
                                    <>
                                        Update Details
                                        <span className="ml-1.5 flex items-center justify-center size-6 rounded-full bg-white/15 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5">
                                            <ArrowRight className="size-3.5 text-white" />
                                        </span>
                                    </>
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <DeleteAccountSection />
            </div>

        </div>
    )
}

function StatCard({ value, label, accent }: { value: number; label: string; accent?: boolean }) {
    return (
        <div
            className={cn(
                "rounded-2xl p-4 flex flex-col items-center gap-1.5 text-center transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5",
                accent
                    ? "bg-primary shadow-[0_8px_24px_rgba(221,39,94,0.2)]"
                    : "bg-surface-container-lowest ring-1 ring-black/5 shadow-sm hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)]",
            )}
        >
            <p className={cn("font-headline font-bold text-2xl", accent ? "text-white" : "text-foreground")}>
                {value}
            </p>
            <p className={cn("font-medium tracking-wider text-[10px] uppercase", accent ? "text-white/70" : "text-muted-foreground")}>
                {label}
            </p>
        </div>
    )
}

export default UserProfile

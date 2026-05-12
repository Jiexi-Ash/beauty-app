"use client"
import { Id } from '@/convex/_generated/dataModel'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { getInitials } from '@/lib/utils'
import { ArrowRight, Loader2, X } from 'lucide-react'
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
                toast.error("An unknown error occurred while cancelling appointment.");
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
            <div className="my-10 space-y-6 max-w-2xl mx-auto">
                <div className="w-full flex justify-center">
                    <Avatar size="xl" className="w-full flex justify-center text-center">
                        <AvatarImage src={profileDetails?.user?.image} alt="" />
                        <AvatarFallback>{getInitials(profileDetails?.user?.fullname ?? "")}</AvatarFallback>
                    </Avatar>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <Card>
                        <CardContent className="flex flex-col gap-2">
                            <p className="font-bold text-primary text-xl text-center">{profileDetails?.upcomingBookings ?? 0}</p>
                            <p className="text-gray-400 font-medium tracking-wider text-xs uppercase text-center">Upcoming Bookings</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="flex flex-col gap-2">
                            <p className="font-bold text-black text-xl text-center">{profileDetails?.completedBookings ?? 0}</p>
                            <p className="text-gray-400 font-medium tracking-wider text-xs uppercase text-center">Completed Bookings</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="flex flex-col gap-2">
                            <p className="font-bold text-black text-xl text-center">{profileDetails?.cancelledBookings ?? 0}</p>
                            <p className="text-gray-400 font-medium tracking-wider text-xs uppercase text-center">Cancelled Bookings</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="flex flex-col gap-2">
                            <p className="font-bold text-black text-xl text-center">{profileDetails?.totalBookings ?? 0}</p>
                            <p className="text-gray-400 font-medium tracking-wider text-xs uppercase text-center">Total Bookings</p>
                        </CardContent>
                    </Card>
                </div>

                <Card className="ring-0">
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
                                                    className="mt-1.5 bg-transparent border-foreground/15 h-12 text-sm"
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
                                                    className="mt-1.5 bg-transparent border-foreground/15 h-12 text-sm"
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
                                                    className="mt-1.5 bg-transparent border-foreground/15 h-12 text-sm"
                                                    onBlur={field.handleBlur}
                                                    onChange={(e) => field.handleChange(e.target.value)}
                                                />
                                            </Field>
                                        )

                                    }}

                                </form.Field>
                            </FieldGroup>

                            <p className="text-xs font-semibold text-gray-400 text-center">Only the phone number can be updated</p>
                            <Button size="lg"
                                className="w-full rounded-sm text-base py-6 bg-primary hover:bg-primary/90"
                                disabled={isPending}
                                type="submit">
                                {isPending ? <Loader2 className="text-white animate-spin size-4" /> : <>Update Details <ArrowRight className="size-4 text-white ml-0.5" /></>}

                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>

        </div>
    )
}

export default UserProfile

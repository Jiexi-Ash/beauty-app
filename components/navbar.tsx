"use client"
import { cn, getInitials } from '@/lib/utils';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Button } from './ui/button';
import { CalendarDays, Compass, Heart, Home, MenuIcon, Settings } from 'lucide-react';
import { SignInButton, SignOutButton, SignUpButton, UserButton, useUser } from '@clerk/nextjs';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';

type NavLink = {
    href: string
    label: string
}

const navLinks: NavLink[] = [
    { href: "/explore", label: "Find a Salon" },
];

function Navbar() {
    const { user } = useUser()
    const pathname = usePathname()

    return (
        <header className="w-full bg-white sticky top-0 z-50 border-b border-gray-100">
            <nav className="w-full flex justify-between items-center max-w-[1440px] mx-auto px-6 py-4">

                <div className="flex items-center gap-6">
                    <Link href="/">
                        <div className="flex items-center gap-0.5 text-2xl font-bold tracking-tight select-none">
                            <span className="text-foreground">The</span>
                            <span className="text-primary">Beauty</span>
                            <span className="text-foreground">App</span>
                        </div>
                    </Link>

                    {/* Desktop nav links */}
                    <div className="hidden md:flex gap-3 items-center">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={cn(
                                    "text-sm font-medium border-b border-transparent transition-colors duration-200",
                                    pathname === link.href
                                        ? "text-primary border-primary font-bold"
                                        : "text-gray-500 hover:text-primary hover:border-primary"
                                )}
                            >
                                {link.label}
                            </Link>
                        ))}

                        {user && (
                            <Link
                                href="/bookings"
                                className={cn(
                                    "text-sm font-medium border-b border-transparent transition-colors duration-200",
                                    pathname === "/bookings"
                                        ? "text-primary border-primary font-bold"
                                        : "text-gray-500 hover:text-primary hover:border-primary"
                                )}
                            >
                                My Bookings
                            </Link>
                        )}
                    </div>
                </div>

                <div className="flex items-center space-x-3">
                    {user ? (
                        <div className="hidden md:flex items-center space-x-3">
                            <UserButton />
                        </div>
                    ) : (
                        <div className="hidden md:flex space-x-3">
                            <SignInButton>
                                <Button variant="ghost" className="cursor-pointer text-primary hover:text-primary hover:border hover:border-primary hover:bg-white">
                                    Sign In
                                </Button>
                            </SignInButton>
                            <SignUpButton>
                                <Button className="cursor-pointer hover:bg-primary/80">Join for Free</Button>
                            </SignUpButton>
                        </div>
                    )}

                    <Sheet>
                        <SheetTrigger>
                            <div className="size-8 flex items-center justify-center rounded-sm hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50 md:hidden">
                                <MenuIcon className="size-5" />
                            </div>
                        </SheetTrigger>
                        <SheetContent side="left" className="flex flex-col p-0 w-[85%] max-w-[340px]">
                            {/* Profile Header */}
                            <div className="p-6 pb-6 border-b border-border">
                                <div className="flex items-center gap-4">
                                    <Avatar className="w-16 h-16 border-2 border-primary">
                                        <AvatarImage src={user?.imageUrl} alt={user?.fullName ?? ""} />
                                        <AvatarFallback>{getInitials(user?.fullName ?? "")}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-lg text-foreground truncate">{user?.fullName}</p>
                                    </div>
                                    <Link href="/profile">
                                        <Settings className="size-5 text-muted-foreground hover:text-foreground transition-colors" />
                                    </Link>
                                </div>
                            </div>

                            {/* Nav Links */}
                            <nav className="flex-1 px-4 py-6 space-y-1">
                                <Link
                                    href="/"
                                    className={cn(
                                        "flex items-center gap-4 px-4 py-3 rounded-full text-sm font-semibold transition-all",
                                        pathname === "/"
                                            ? "bg-primary text-white shadow-md"
                                            : "text-muted-foreground hover:bg-accent hover:text-foreground"
                                    )}
                                >
                                    <Home className="size-5" />
                                    Home
                                </Link>

                                <div className="h-px bg-border mx-2" />

                                <Link
                                    href="/explore"
                                    className={cn(
                                        "flex items-center gap-4 px-4 py-3 rounded-full text-sm font-semibold transition-all",
                                        pathname === "/explore"
                                            ? "bg-primary text-white shadow-md"
                                            : "text-muted-foreground hover:bg-accent hover:text-foreground"
                                    )}
                                >
                                    <Compass className="size-5" />
                                    Explore
                                </Link>

                                {user && (
                                    <>
                                        <div className="h-px bg-border mx-2" />
                                        <Link
                                            href="/bookings"
                                            className={cn(
                                                "flex items-center gap-4 px-4 py-3 rounded-full text-sm font-semibold transition-all",
                                                pathname === "/bookings"
                                                    ? "bg-primary text-white shadow-md"
                                                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                                            )}
                                        >
                                            <CalendarDays className="size-5" />
                                            My Bookings
                                        </Link>

                                        <div className="h-px bg-border mx-2" />
                                        <Link
                                            href="/favorites"
                                            className={cn(
                                                "flex items-center gap-4 px-4 py-3 rounded-full text-sm font-semibold transition-all",
                                                pathname === "/favorites"
                                                    ? "bg-primary text-white shadow-md"
                                                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                                            )}
                                        >
                                            <Heart className="size-5" />
                                            Favorites
                                        </Link>
                                    </>
                                )}
                            </nav>

                            {/* Footer */}
                            <div className="p-6 border-t border-border">
                                {user ? (
                                    <SignOutButton>
                                        <Button variant="secondary" className="w-full font-semibold rounded-2xl h-12">
                                            Log Out
                                        </Button>
                                    </SignOutButton>
                                ) : (
                                    <div className="flex flex-col gap-3">
                                        <SignUpButton>
                                            <Button className="w-full font-semibold rounded-2xl h-12">Join for Free</Button>
                                        </SignUpButton>
                                        <SignInButton>
                                            <Button variant="outline" className="w-full font-semibold rounded-2xl h-12">Sign In</Button>
                                        </SignInButton>
                                    </div>
                                )}
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>

            </nav>
        </header>
    )
}

export default Navbar
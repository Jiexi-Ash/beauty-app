"use client"
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Button } from './ui/button';
import { MenuIcon } from 'lucide-react';

type NavLink = {
    href: string
    label: string
}

const navLinks: NavLink[] = [
    { href: "/explore", label: "Find a Salon" },
    { href: "/business", label: "For Business" },
];

function Navbar() {
    const pathname = usePathname()

    return (
        <header className="w-full bg-white flex items-center justify-between py-4 px-6 sticky top-0 z-50 border-b border-gray-100">
            <nav className="w-full flex justify-between items-center max-w-[1440px] container mx-auto">

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
                    </div>
                </div>


                <div className="flex items-center space-x-3">
                    <div className="hidden md:flex space-x-3">
                        <Button variant="ghost" className="cursor-pointer text-primary hover:text-primary hover:border hover:border-primary hover:bg-white">
                            Sign In
                        </Button>
                        <Button className="cursor-pointer hover:bg-primary/80">Join for Free</Button>
                    </div>


                    <Sheet>
                        <SheetTrigger>
                            <div className="size-8 flex items-center justify-center rounded-sm hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50 md:hidden">
                                <MenuIcon className="size-5 " />
                            </div>
                        </SheetTrigger>
                        <SheetContent side="left">
                            <div className="flex flex-col">
                                <div className="flex items-center gap-0.5 text-2xl font-bold tracking-tight select-none pl-6 py-6">
                                    <span className="text-foreground">The</span>
                                    <span className="text-primary">Beauty</span>
                                    <span className="text-foreground">App</span>
                                </div>
                                <div className="flex flex-col gap-4">
                                    {navLinks.map((link) => (
                                        <Link
                                            key={link.href}
                                            href={link.href}
                                            className={cn(
                                                "px-6 py-3 text-sm font-medium",
                                                pathname === link.href
                                                    ? "bg-accent text-accent-foreground"
                                                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                                            )}
                                        >
                                            {link.label}
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>

            </nav>
        </header >
    )
}

export default Navbar
"use client"
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    Sheet,
    SheetContent,
    SheetTrigger,
} from "@/components/ui/sheet"
import { Button } from './ui/button';
import { MenuIcon } from 'lucide-react';


type NavLink = {
    href: string
    label: string
}
const navLinks: NavLink[] = [
    { href: "/", label: "Home" },
    { href: "/explore", label: "Explore" },
    { href: "/appointments", label: "Appointments", },

];
// TODO ADD user check and display user profile + dashboard if owner
function Navbar() {
    const pathname = usePathname()
    return (
        <nav className="container mx-auto py-6 px-6 md:px-0">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-0.5 text-2xl font-bold tracking-tight select-none">
                    <span className="text-foreground">The</span>
                    <span className="text-primary">Beauty</span>
                    <span className="text-foreground">App</span>
                </div>
                {/* desktop */}
                <div className="hidden md:flex gap-1 items-center">
                    {navLinks.map((link) => (
                        <Link className={cn(
                            "flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors",
                            pathname === link.href
                                ? "bg-accent text-accent-foreground font-medium"
                                : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                        )} key={link.label} href={link.href}>{link.label}</Link>
                    ))}
                </div>

                {/* mobile */}
                <Sheet>
                    <SheetTrigger render={(<Button variant="ghost" size="icon" className="md:hidden">
                        <MenuIcon className="size-5" />
                    </Button>)}></SheetTrigger>
                    <SheetContent side="left" className="">
                        <div className="flex flex-col">
                            <div className="flex items-center gap-0.5 text-2xl font-bold tracking-tight select-none pl-6 py-6">
                                <span className="text-foreground">The</span>
                                <span className="text-primary">Beauty</span>
                                <span className="text-foreground">App</span>
                            </div>
                            <div className="gap-4 flex flex-col">
                                {navLinks.map((link) => (
                                    <Link className={cn("px-6 py-3 text-sm font-medium", pathname === link.href ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-accent/50 hover:text-foreground")} href={link.label} key={link.label}>{link.label}</Link>
                                ))}
                            </div>
                        </div>
                    </SheetContent>
                </Sheet>

            </div>
        </nav>
    )
}

export default Navbar
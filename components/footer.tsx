function Footer() {
    return (
        <footer className="bg-surface-container-low w-full py-16 px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-12 max-w-7xl mx-auto text-sm">
                <div className="col-span-2 md:col-span-1">
                    <span className="text-xl font-black mb-4 block font-headline select-none">The <span className="text-primary">Beauty</span>App</span>
                    <p className="text-on-surface-variant mb-6 max-w-xs">Connecting community talent with local beauty lovers.</p>
                </div>
                <div>
                    <h5 className="font-bold mb-6">Platform</h5>
                    <ul className="space-y-4">
                        <li><a className="text-on-surface-variant hover:text-primary underline underline-offset-4 transition-all duration-200" href="/explore">Search</a></li>
                        <li><a className="text-on-surface-variant hover:text-primary underline underline-offset-4 transition-all duration-200" href="#pricing">Pricing</a></li>
                        <li><a className="text-on-surface-variant hover:text-primary underline underline-offset-4 transition-all duration-200" href="/dashboard">Dashboard</a></li>
                    </ul>
                </div>
                <div>
                    <h5 className="font-bold mb-6">Company</h5>
                    <ul className="space-y-4">
                        <li><span className="text-on-surface-variant/50 cursor-default select-none">About</span></li>
                        <li><span className="text-on-surface-variant/50 cursor-default select-none">Careers</span></li>
                        <li><span className="text-on-surface-variant/50 cursor-default select-none">Contact</span></li>
                    </ul>
                </div>
                <div>
                    <h5 className="font-bold mb-6">Legal</h5>
                    <ul className="space-y-4">
                        <li><span className="text-on-surface-variant/50 cursor-default select-none">Privacy Policy</span></li>
                        <li><span className="text-on-surface-variant/50 cursor-default select-none">Terms of Service</span></li>
                    </ul>
                </div>
            </div>
            <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-surface-container-high flex flex-col md:flex-row justify-between items-center gap-4">
                <p className="text-on-surface-variant text-sm">© 2026 The Beauty App. The Elevated Community Standard.</p>
            </div>
        </footer>
    )
}

export default Footer
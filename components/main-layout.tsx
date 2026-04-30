import Navbar from "./navbar"

function MainLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-stone-50 flex flex-col">
            <Navbar />
            <main className="flex-1 w-full mx-auto px-6 py-4 max-w-[1440px]">
                {children}
            </main>
        </div>
    )
}

export default MainLayout
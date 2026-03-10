import Hero from "@/components/hero";
import Navbar from "@/components/navbar";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col w-full" style={{ backgroundImage: "linear-gradient(135deg, var(--gradient-start), var(--gradient-mid), var(--gradient-end))" }}>
      <div className="absolute top-20 left-10 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-float" style={{ animationDelay: "2s" }} />
      <div className="absolute top-1/2 left-1/3 w-80 h-80 bg-primary/15 rounded-full blur-3xl animate-float" style={{ animationDelay: "4s" }} />
      <Navbar />
      <Hero />
    </div>
  );
}

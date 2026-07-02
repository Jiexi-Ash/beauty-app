"use client";

import { api } from "@/convex/_generated/api";
import { Preloaded, usePreloadedQuery } from "convex/react";
import { Id } from "@/convex/_generated/dataModel";
import MainLayout from "./main-layout";
import Navbar from "./navbar";
import Footer from "./footer";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Heart, MapPin, Star } from "@phosphor-icons/react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { useMutation } from "@tanstack/react-query";
import { useConvexMutation } from "@convex-dev/react-query";
import { toast } from "sonner";
import { ConvexError } from "convex/values";

interface FavoritesProps {
  preloadedFavorites: Preloaded<typeof api.users.getUserFavorites>;
}

function Favorites({ preloadedFavorites }: FavoritesProps) {
  const favorites = usePreloadedQuery(preloadedFavorites);

  if (favorites.length === 0) return <NoFavorites />;

  return (
    <MainLayout>
      <div className="space-y-6 w-full">
        <div className="flex flex-col gap-1">
          <h1 className="font-headline font-bold text-2xl">My Favorites</h1>
          <p className="text-muted-foreground">
            Salons and spas you&apos;ve saved for later.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {favorites.map((business) => (
            <FavoriteCard key={business._id} business={business} />
          ))}
        </div>
      </div>
    </MainLayout>
  );
}

export default Favorites;

type FavoriteBusiness = {
  _id: Id<"business">;
  name: string;
  city: string;
  slug: string;
  tags: string[];
  coverImageUrl: string | null;
  averageRating: number;
  reviewCount: number;
};

function FavoriteCard({ business }: { business: FavoriteBusiness }) {
  const { mutate: toggleFavorites, isPending } = useMutation({
    mutationFn: useConvexMutation(api.users.toggleFavorites),
    onSuccess: () => {
      toast.success("Removed from favorites");
    },
    onError: (error) => {
      if (error instanceof ConvexError) {
        toast.error(
          error.data || "An unknown error occurred while updating favorites.",
        );
      } else if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("An unknown error occurred while updating favorites.");
      }
    },
  });

  return (
    <div className="group flex flex-col gap-3">
      <Link
        href={`/explore/${business.slug}`}
        className="relative block aspect-4/3 overflow-hidden rounded-tl-3xl rounded-br-3xl shadow-[0_4px_20px_rgba(0,0,0,0.05)] transition-shadow duration-500 hover:shadow-[0_8px_28px_rgba(0,0,0,0.09)]"
      >
        <Image
          src={business.coverImageUrl ?? ""}
          fill
          alt={`${business.name} cover photo`}
          className="object-cover transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-105"
        />

        {business.reviewCount > 0 && (
          <div className="absolute top-3 left-3 flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 shadow-sm">
            <Star className="size-3 text-amber-400" weight="fill" />
            <span className="text-xs font-bold">
              {business.averageRating.toFixed(1)}
            </span>
          </div>
        )}

        <Button
          variant="ghost"
          size="icon"
          disabled={isPending}
          aria-label="Remove from favorites"
          className="absolute top-3 right-3 rounded-full bg-white/95 shadow-[0_4px_16px_rgba(0,0,0,0.1)] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)] active:scale-[0.96]"
          onClick={(e) => {
            e.preventDefault();
            toggleFavorites({ businessId: business._id });
          }}
        >
          <Heart weight="fill" className="size-4 text-primary" />
        </Button>
      </Link>

      <div className="flex flex-col gap-1.5 px-1">
        <Link href={`/explore/${business.slug}`}>
          <h3 className="font-headline font-bold transition-colors duration-300 group-hover:text-primary">
            {business.name}
          </h3>
        </Link>
        <div className="flex items-center gap-1 text-muted-foreground">
          <MapPin className="size-3.5 shrink-0" />
          <span className="text-xs">{business.city}</span>
        </div>
        {business.tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            {business.tags.slice(0, 2).map((tag) => (
              <Badge key={tag} className="bg-secondary text-primary font-medium">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function NoFavorites() {
  return (
    <div className="w-full min-h-screen bg-background flex flex-col">
      <Navbar />

      <div
        className="flex-1 flex flex-col items-center justify-center px-4 py-20"
        style={{ backgroundImage: "var(--background-image-gradient-rose)" }}
      >
        <div className="p-1 rounded-full bg-black/[0.04] ring-1 ring-black/5 mb-6">
          <div className="size-14 rounded-full bg-surface-container-lowest flex items-center justify-center shadow-sm">
            <Heart weight="fill" className="size-6 text-primary" />
          </div>
        </div>

        <h1 className="font-headline text-4xl md:text-5xl font-bold text-foreground text-center mb-3 tracking-tight">
          Nothing <span className="text-primary">saved</span> yet.
        </h1>
        <p className="text-muted-foreground text-center max-w-sm mb-10">
          Favorite the salons and spas you love so you can find them again
          fast.
        </p>

        <Card className="bg-surface-container-lowest/90 backdrop-blur-xl rounded-2xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.06)] ring-1 ring-black/5 w-full max-w-sm text-center">
          <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
            Discover top-rated salons in your area and tap the heart icon on
            any profile to save it here.
          </p>
          <Button
            className="group w-full rounded-full font-semibold py-3 bg-primary hover:bg-primary/90 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98]"
            size="lg"
          >
            <Link href="/explore" className="flex items-center justify-center gap-1.5 w-full">
              Browse Salons
              <span className="flex items-center justify-center size-6 rounded-full bg-white/15 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5">
                <ArrowRight className="size-3.5 text-white" />
              </span>
            </Link>
          </Button>
        </Card>
      </div>

      <Footer />
    </div>
  );
}

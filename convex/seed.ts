import { internalMutation } from "./_generated/server";

export const seedCategories = internalMutation({
  handler: async (ctx) => {
    const categories = [
      "Hair",
      "Nails",
      "Eyes",
      "Skin & Facials",
      "Makeup",
      "Lashes & Brows",
      "Other",
    ];

    for (const name of categories) {
      const existing = await ctx.db
        .query("categories")
        .withIndex("by_name", (q) => q.eq("name", name))
        .first();

      if (!existing) {
        await ctx.db.insert("categories", { name });
      }
    }
  },
});

export const seedSubscriptionTiers = internalMutation({
  handler: async (ctx) => {
    const existing = await ctx.db.query("subscriptionTiers").collect();
    if (existing.length > 0) {
      console.log("Subscription tiers already seeded, skipping.");
      return;
    }

    await ctx.db.insert("subscriptionTiers", {
      tier: "free",
      price: 0,
      commission: 10,
    });
    await ctx.db.insert("subscriptionTiers", {
      tier: "pro",
      price: 6900,
      commission: 0,
    });
    await ctx.db.insert("subscriptionTiers", {
      tier: "business",
      price: 14900,
      commission: 0,
    });

    console.log("Subscription tiers seeded.");
  },
});

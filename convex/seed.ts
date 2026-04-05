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


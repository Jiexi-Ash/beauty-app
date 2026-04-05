import { query } from "./_generated/server"


export const getCategories = query({
    handler: async (ctx) => {
        return ctx.db.query("categories").collect()
    }
})
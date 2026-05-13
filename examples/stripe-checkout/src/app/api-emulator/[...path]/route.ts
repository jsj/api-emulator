import { createApiEmulatorHandler } from "@api-emulator/adapter-next";
import type { ServicePlugin } from "@api-emulator/core";

const stripePlugin: ServicePlugin = {
  name: "stripe",
  register(app) {
    app.all("/*", (c) => c.json({ ok: true, provider: "stripe", path: c.req.path }));
  },
};

export const { GET, POST, PUT, PATCH, DELETE } = createApiEmulatorHandler({
  services: {
    stripe: {
      emulator: { plugin: stripePlugin },
      seed: {
        products: [
          { id: "prod_hoodie", name: "API Emulator Hoodie", description: "Stay warm while shipping" },
          { id: "prod_stickers", name: "API Emulator Sticker Pack", description: "Decorate your laptop" },
          { id: "prod_mug", name: "API Emulator Mug", description: "Fuel your coding sessions" },
          { id: "prod_tshirt", name: "API Emulator T-Shirt", description: "A comfortable tee for local development" },
        ],
        prices: [
          { id: "price_hoodie", product_name: "API Emulator Hoodie", currency: "usd", unit_amount: 5000 },
          { id: "price_stickers", product_name: "API Emulator Sticker Pack", currency: "usd", unit_amount: 800 },
          { id: "price_mug", product_name: "API Emulator Mug", currency: "usd", unit_amount: 1500 },
          { id: "price_tshirt", product_name: "API Emulator T-Shirt", currency: "usd", unit_amount: 2500 },
        ],
        webhooks: [
          {
            url: `http://localhost:${process.env.PORT ?? "3000"}/api/webhooks/stripe`,
            events: ["*"],
          },
        ],
      },
    },
  },
});

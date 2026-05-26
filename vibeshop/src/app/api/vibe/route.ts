import OpenAI from "openai";
import { catalog } from "@/lib/catalog";
import { StyleProfile, CuratedProduct, VibeContext } from "@/lib/types";

const client = new OpenAI({
  apiKey: process.env.SUBCONSCIOUS_API_KEY,
  baseURL: "https://api.subconscious.dev/v1",
});

const MODEL = "subconscious/tim-qwen3.6-27b";

const tools: OpenAI.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "decompose_aesthetic",
      description:
        "Decompose a user's vibe description into a structured style profile with color palette, materials, mood keywords, anchoring furniture categories, things to avoid, and lighting profile.",
      parameters: {
        type: "object",
        properties: {
          aesthetic_name: { type: "string", description: "Name of the aesthetic" },
          color_palette: {
            type: "array",
            items: { type: "string" },
            description: "4-6 hex color codes",
          },
          primary_materials: {
            type: "array",
            items: { type: "string" },
            description: "Key materials for this aesthetic",
          },
          silhouette_style: {
            type: "string",
            description: "Description of furniture silhouettes",
          },
          mood_keywords: {
            type: "array",
            items: { type: "string" },
            description: "4-6 mood/feeling words",
          },
          anchoring_categories: {
            type: "array",
            items: { type: "string" },
            description:
              "5-6 furniture categories to search. Use these exact values: sofa, accent-chair, coffee-table, bookshelf, floor-lamp, area-rug, side-table, bed, wall-art, decor",
          },
          avoid: {
            type: "array",
            items: { type: "string" },
            description: "Styles/materials to avoid",
          },
          lighting_type: {
            type: "string",
            enum: ["warm point", "soft diffused", "bright airy", "rich warm"],
          },
          lighting_color_temp: { type: "number", description: "Kelvin, 2700-5000" },
          lighting_intensity: {
            type: "string",
            enum: ["low", "low-medium", "medium", "medium-high", "high"],
          },
          lighting_accent_color: { type: "string", description: "Hex color for accent light" },
        },
        required: [
          "aesthetic_name",
          "color_palette",
          "primary_materials",
          "silhouette_style",
          "mood_keywords",
          "anchoring_categories",
          "avoid",
          "lighting_type",
          "lighting_color_temp",
          "lighting_intensity",
          "lighting_accent_color",
        ],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_products",
      description:
        "Search the product catalog using the style profile. Returns matching products filtered by aesthetic tags, materials, and categories.",
      parameters: {
        type: "object",
        properties: {
          aesthetic_tags: {
            type: "array",
            items: { type: "string" },
            description:
              "Aesthetic tags to match. Use: dark-academia, japandi, coastal-grandmother, maximalist, cottagecore, scandinavian, mid-century, industrial, bohemian, minimalist",
          },
          material_tags: {
            type: "array",
            items: { type: "string" },
            description: "Material keywords to prefer",
          },
          categories: {
            type: "array",
            items: { type: "string" },
            description: "Categories to search",
          },
          max_price: {
            type: "number",
            description: "Maximum price filter. 0 means no limit.",
          },
        },
        required: ["aesthetic_tags", "material_tags", "categories"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "curate_room_set",
      description:
        "From candidate products, select 6-8 that form a cohesive room set. Each piece should serve a distinct role. Return product IDs with a vibe_note explaining why each piece was chosen.",
      parameters: {
        type: "object",
        properties: {
          selected_products: {
            type: "array",
            items: {
              type: "object",
              properties: {
                product_id: { type: "string" },
                vibe_note: {
                  type: "string",
                  description: "1 sentence explaining why this piece fits the vibe",
                },
              },
              required: ["product_id", "vibe_note"],
            },
            description: "6-8 products selected for the room",
          },
        },
        required: ["selected_products"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "generate_vibe_context",
      description:
        "Generate the final UI rendering context: board title, description, and lighting settings for the 3D room.",
      parameters: {
        type: "object",
        properties: {
          board_title: { type: "string", description: "e.g. Your Dark Academia Living Room" },
          board_description: {
            type: "string",
            description: "1-2 sentence mood description",
          },
          color_palette_hex: {
            type: "array",
            items: { type: "string" },
            description: "3-4 hex colors for UI theming",
          },
        },
        required: ["board_title", "board_description", "color_palette_hex"],
      },
    },
  },
];

function searchProducts(input: {
  aesthetic_tags: string[];
  material_tags: string[];
  categories: string[];
  max_price?: number;
}) {
  return catalog.filter((p) => {
    const aestheticMatch = p.aesthetic_tags.some((t) => input.aesthetic_tags.includes(t));
    const categoryMatch =
      input.categories.length === 0 || input.categories.includes(p.category);
    const priceMatch = !input.max_price || input.max_price === 0 || p.price <= input.max_price;
    const materialBonus = p.material_tags.some((t) =>
      input.material_tags.some((m) => t.toLowerCase().includes(m.toLowerCase()))
    );
    return (aestheticMatch || materialBonus) && categoryMatch && priceMatch;
  });
}

export async function POST(req: Request) {
  try {
    const { vibe } = await req.json();

    if (!vibe || typeof vibe !== "string") {
      return Response.json({ error: "vibe is required" }, { status: 400 });
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        function send(event: string, data: unknown) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ event, data })}\n\n`)
          );
        }

        let styleProfile: StyleProfile | null = null;
        let candidateProducts: typeof catalog = [];
        let curatedSet: { product_id: string; vibe_note: string }[] = [];

        const messages: OpenAI.ChatCompletionMessageParam[] = [
          {
            role: "system",
            content: "You are a world-class interior design AI for Wayfair. Follow the user's instructions precisely, calling each tool exactly once in order.",
          },
          {
            role: "user",
            content: `A customer described their desired vibe:

"${vibe}"

Follow these steps IN ORDER, calling each tool exactly once:

1. Call decompose_aesthetic to break down the vibe into a structured style profile.
2. Call search_products with the aesthetic tags, materials, and categories from step 1.
3. Call curate_room_set to pick 6-8 cohesive products from the search results.
4. Call generate_vibe_context to create the final board title, description, and colors.

Be creative and specific. Each vibe_note should be a single evocative sentence.`,
          },
        ];

        let continueLoop = true;

        while (continueLoop) {
          const response = await client.chat.completions.create({
            model: MODEL,
            max_tokens: 4096,
            tools,
            messages,
          });

          const choice = response.choices[0];
          const message = choice.message;

          // Add assistant message to history
          messages.push(message);

          const toolCalls = message.tool_calls;
          if (!toolCalls || toolCalls.length === 0) {
            continueLoop = false;
            break;
          }

          for (const toolCall of toolCalls) {
            if (toolCall.type !== "function") continue;
            const args = JSON.parse(toolCall.function.arguments);
            let result: unknown;

            switch (toolCall.function.name) {
              case "decompose_aesthetic": {
                styleProfile = {
                  aesthetic_name: args.aesthetic_name,
                  color_palette: args.color_palette,
                  primary_materials: args.primary_materials,
                  silhouette_style: args.silhouette_style,
                  mood_keywords: args.mood_keywords,
                  anchoring_categories: args.anchoring_categories,
                  avoid: args.avoid,
                  lighting_profile: {
                    type: args.lighting_type,
                    color_temp: args.lighting_color_temp,
                    intensity: args.lighting_intensity,
                    accent_color: args.lighting_accent_color,
                  },
                };
                send("thinking", {
                  step: "aesthetic",
                  profile: styleProfile,
                });
                result = { success: true, profile: styleProfile };
                break;
              }
              case "search_products": {
                candidateProducts = searchProducts(args);
                send("thinking", {
                  step: "search",
                  count: candidateProducts.length,
                });
                result = {
                  products: candidateProducts.map((p) => ({
                    id: p.id,
                    name: p.name,
                    category: p.category,
                    price: p.price,
                    rating: p.rating,
                    aesthetic_tags: p.aesthetic_tags,
                    material_tags: p.material_tags,
                    colors: p.colors,
                    description: p.description,
                  })),
                };
                break;
              }
              case "curate_room_set": {
                curatedSet = args.selected_products;
                send("thinking", {
                  step: "curate",
                  count: curatedSet.length,
                });
                result = { success: true, count: curatedSet.length };
                break;
              }
              case "generate_vibe_context": {
                const products: CuratedProduct[] = curatedSet
                  .map((sel: { product_id: string; vibe_note: string }) => {
                    const product = catalog.find((p) => p.id === sel.product_id);
                    if (!product) return null;
                    return {
                      ...product,
                      vibe_note: sel.vibe_note,
                      position_3d: { x: 0, y: 0, z: 0 },
                      rotation_3d: { y: 0 },
                    };
                  })
                  .filter(Boolean) as CuratedProduct[];

                const vibeContext: VibeContext = {
                  board_title: args.board_title,
                  board_description: args.board_description,
                  room_lighting: styleProfile?.lighting_profile ?? {
                    type: "warm point",
                    color_temp: 3000,
                    intensity: "medium",
                    accent_color: "#C4A35A",
                  },
                  color_palette_hex: args.color_palette_hex,
                  products,
                };

                send("result", vibeContext);
                result = { success: true };
                break;
              }
            }

            messages.push({
              role: "tool",
              tool_call_id: toolCall.id,
              content: JSON.stringify(result),
            });
          }

          if (choice.finish_reason === "stop") {
            continueLoop = false;
          }
        }

        send("done", {});
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Vibe API error:", error);
    return Response.json(
      { error: "Failed to process vibe" },
      { status: 500 }
    );
  }
}

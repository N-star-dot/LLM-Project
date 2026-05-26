import Anthropic from "@anthropic-ai/sdk";
import { catalog } from "@/lib/catalog";
import { StyleProfile, CuratedProduct, VibeContext } from "@/lib/types";

const client = new Anthropic();

const tools: Anthropic.Tool[] = [
  {
    name: "decompose_aesthetic",
    description:
      "Decompose a user's vibe description into a structured style profile with color palette, materials, mood keywords, anchoring furniture categories, things to avoid, and lighting profile.",
    input_schema: {
      type: "object" as const,
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
  {
    name: "search_products",
    description:
      "Search the product catalog using the style profile. Returns matching products filtered by aesthetic tags, materials, and categories.",
    input_schema: {
      type: "object" as const,
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
  {
    name: "curate_room_set",
    description:
      "From candidate products, select 6-8 that form a cohesive room set. Each piece should serve a distinct role. Return product IDs with a vibe_note explaining why each piece was chosen.",
    input_schema: {
      type: "object" as const,
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
  {
    name: "generate_vibe_context",
    description:
      "Generate the final UI rendering context: board title, description, and lighting settings for the 3D room.",
    input_schema: {
      type: "object" as const,
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

        const messages: Anthropic.MessageParam[] = [
          {
            role: "user",
            content: `You are a world-class interior design AI for Wayfair. A customer described their desired vibe:

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
          const response = await client.messages.create({
            model: "claude-sonnet-4-6-20250514",
            max_tokens: 4096,
            tools,
            messages,
          });

          const toolResults: Anthropic.MessageParam[] = [];
          let hasToolUse = false;

          for (const block of response.content) {
            if (block.type === "tool_use") {
              hasToolUse = true;
              let result: unknown;

              switch (block.name) {
                case "decompose_aesthetic": {
                  const input = block.input as Record<string, unknown>;
                  styleProfile = {
                    aesthetic_name: input.aesthetic_name as string,
                    color_palette: input.color_palette as string[],
                    primary_materials: input.primary_materials as string[],
                    silhouette_style: input.silhouette_style as string,
                    mood_keywords: input.mood_keywords as string[],
                    anchoring_categories: input.anchoring_categories as string[],
                    avoid: input.avoid as string[],
                    lighting_profile: {
                      type: input.lighting_type as string,
                      color_temp: input.lighting_color_temp as number,
                      intensity: input.lighting_intensity as string,
                      accent_color: input.lighting_accent_color as string,
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
                  const input = block.input as {
                    aesthetic_tags: string[];
                    material_tags: string[];
                    categories: string[];
                    max_price?: number;
                  };
                  candidateProducts = searchProducts(input);
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
                  const input = block.input as {
                    selected_products: { product_id: string; vibe_note: string }[];
                  };
                  curatedSet = input.selected_products;
                  send("thinking", {
                    step: "curate",
                    count: curatedSet.length,
                  });
                  result = { success: true, count: curatedSet.length };
                  break;
                }
                case "generate_vibe_context": {
                  const input = block.input as {
                    board_title: string;
                    board_description: string;
                    color_palette_hex: string[];
                  };

                  const products: CuratedProduct[] = curatedSet
                    .map((sel) => {
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
                    board_title: input.board_title,
                    board_description: input.board_description,
                    room_lighting: styleProfile?.lighting_profile ?? {
                      type: "warm point",
                      color_temp: 3000,
                      intensity: "medium",
                      accent_color: "#C4A35A",
                    },
                    color_palette_hex: input.color_palette_hex,
                    products,
                  };

                  send("result", vibeContext);
                  result = { success: true };
                  break;
                }
              }

              if (!toolResults.find((m) => m.role === "assistant")) {
                toolResults.push({ role: "assistant", content: response.content });
              }
              toolResults.push({
                role: "user",
                content: [
                  {
                    type: "tool_result",
                    tool_use_id: block.id,
                    content: JSON.stringify(result),
                  },
                ],
              });
            }
          }

          if (hasToolUse) {
            messages.push(...toolResults);
          }

          if (response.stop_reason === "end_turn" || !hasToolUse) {
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

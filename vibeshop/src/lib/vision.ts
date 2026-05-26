import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.SUBCONSCIOUS_API_KEY,
  baseURL: "https://api.subconscious.dev/v1",
});

const VISION_MODEL = "subconscious/tim-qwen3.6-27b";

export async function extractVibeFromImage(
  imageBase64OrUrl: string,
  mimeType: string
): Promise<string> {
  const imageUrl = imageBase64OrUrl.startsWith("http")
    ? imageBase64OrUrl
    : `data:${mimeType};base64,${imageBase64OrUrl}`;

  const response = await client.chat.completions.create({
    model: VISION_MODEL,
    max_tokens: 300,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: { url: imageUrl },
          },
          {
            type: "text",
            text: `You are an expert interior designer. Analyze this room or furniture image and describe the aesthetic in rich, specific language.

Return a single paragraph (2-3 sentences) describing:
- The overall aesthetic name (e.g. Dark Academia, Japandi, Coastal Grandmother, Maximalist, Cottagecore)
- The dominant colors, materials, and textures you see
- The mood and feeling of the space

Write it as a vibe description a shopper would type, e.g. "Dark academia library vibes — deep mahogany wood, tufted velvet in forest green and burgundy, warm brass accents, moody and intellectual atmosphere."

Only return the vibe description. No other text.`,
          },
        ],
      },
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("No vibe extracted from image");
  return content.trim();
}

export async function extractVibeFromVideoFrames(
  framesBase64: string[]
): Promise<string> {
  const imageMessages: OpenAI.ChatCompletionContentPartImage[] = framesBase64.map((b64) => ({
    type: "image_url" as const,
    image_url: { url: `data:image/jpeg;base64,${b64}` },
  }));

  const response = await client.chat.completions.create({
    model: VISION_MODEL,
    max_tokens: 400,
    messages: [
      {
        role: "user",
        content: [
          ...imageMessages,
          {
            type: "text",
            text: `These are 4 frames from a room walkthrough video. Analyze the full space across all frames and describe the room's aesthetic, existing furniture style, colors, and materials. Then suggest what furniture would complement this space.

Return a single paragraph (2-3 sentences) as a vibe description a shopper would type, e.g. "Warm mid-century modern living room — walnut furniture, mustard and olive tones, clean lines with organic shapes, cozy and sophisticated."

Only return the vibe description. No other text.`,
          },
        ],
      },
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("No vibe extracted from video");
  return content.trim();
}

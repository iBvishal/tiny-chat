import { parseChatRequest } from "@/lib/chat-request";
import { getModel } from "@/lib/constants";
import { streamGemini } from "@/lib/gemini";

/** Vercel rejects request bodies over 4.5 MB before they get here */
const MAX_BODY_LENGTH = 4_500_000;

function errorResponse(status: number, message: string) {
  return Response.json({ error: { message } }, { status });
}

/**
 * Streams a Gemini reply using the site's shared key, which never reaches the
 * browser. The Gemini event stream is passed through unchanged.
 */
export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return errorResponse(503, "This site has no shared Gemini API key configured.");
  }

  const body = await request.text();
  if (body.length > MAX_BODY_LENGTH) {
    return errorResponse(413, "The request is too large.");
  }

  let json: unknown;
  try {
    json = JSON.parse(body);
  } catch {
    return errorResponse(400, "The request is not valid JSON.");
  }

  const chatRequest = parseChatRequest(json);
  if (!chatRequest) {
    return errorResponse(400, "The request is not valid.");
  }
  if (!getModel(chatRequest.model).sharedKey) {
    return errorResponse(403, "This model needs your own Gemini API key.");
  }

  let upstream: Response;
  try {
    upstream = await streamGemini(chatRequest, apiKey, request.signal);
  } catch (error) {
    if (request.signal.aborted) return new Response(null, { status: 499 });
    console.error("Could not reach Gemini:", error);
    return errorResponse(502, "Could not reach Gemini. Try again in a moment.");
  }

  return new Response(upstream.body, {
    status: upstream.status,
    headers: {
      "content-type": upstream.ok ? "text/event-stream" : "application/json",
      "cache-control": "no-store",
    },
  });
}

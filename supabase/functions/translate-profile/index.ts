import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json; charset=utf-8",
};

const SUPPORTED_LANGUAGES = [
  "en",
  "zh-CN",
  "zh-TW",
  "ja",
  "ru",
] as const;

type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

const languageNames: Record<SupportedLanguage, string> = {
  "en": "English",
  "zh-CN": "Simplified Chinese",
  "zh-TW": "Traditional Chinese",
  "ja": "Japanese",
  "ru": "Russian",
};

function jsonResponse(
  body: Record<string, unknown>,
  status = 200,
) {
  return new Response(JSON.stringify(body), {
    status,
    headers: corsHeaders,
  });
}

function normalizeLanguage(value: unknown): SupportedLanguage | null {
  if (typeof value !== "string") {
    return null;
  }

  const valueLower = value.trim().toLowerCase();

  if (valueLower === "en" || valueLower.startsWith("en-")) {
    return "en";
  }

  if (
    valueLower === "zh-cn" ||
    valueLower === "zh-hans" ||
    valueLower === "zh"
  ) {
    return "zh-CN";
  }

  if (
    valueLower === "zh-tw" ||
    valueLower === "zh-hant" ||
    valueLower === "zh-hk" ||
    valueLower === "zh-mo"
  ) {
    return "zh-TW";
  }

  if (valueLower === "ja" || valueLower.startsWith("ja-")) {
    return "ja";
  }

  if (valueLower === "ru" || valueLower.startsWith("ru-")) {
    return "ru";
  }

  return null;
}

function languageColumn(
  field: "description" | "occupation" | "interests",
  language: SupportedLanguage,
) {
  const suffixMap: Record<SupportedLanguage, string> = {
    "en": "en",
    "zh-CN": "zh_cn",
    "zh-TW": "zh_tw",
    "ja": "ja",
    "ru": "ru",
  };

  return `${field}_${suffixMap[language]}`;
}

function cleanText(value: unknown): string {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

async function translateText(
  text: string,
  targetLanguage: SupportedLanguage,
  apiKey: string,
): Promise<string> {
  if (!text) {
    return "";
  }

  const targetName = languageNames[targetLanguage];

  const prompt = `
You are a professional multilingual translator for a dating website.

Translate the following profile text into ${targetName}.

Requirements:
1. Preserve the original meaning.
2. Do not add information that is not present.
3. Do not remove meaningful information.
4. Keep the tone natural, warm, and suitable for a personal dating profile.
5. Do not make the text overly romantic or exaggerated.
6. Preserve names, numbers, measurements, city names, brand names, WhatsApp, Telegram usernames and URLs.
7. Return ONLY the translated text.
8. Do not add quotation marks.
9. Do not add explanations.

Original text:
${text}
`;

  const response = await fetch(
    "https://api.openai.com/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.2,
        messages: [
          {
            role: "system",
            content:
              "You are a precise professional translator. Return only the translated text.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();

    console.error(
      "Translation API error:",
      response.status,
      errorText,
    );

    throw new Error(
      `Translation service returned HTTP ${response.status}`,
    );
  }

  const data = await response.json();

  const result =
    data?.choices?.[0]?.message?.content;

  if (typeof result !== "string" || !result.trim()) {
    throw new Error("Translation service returned empty text");
  }

  return result.trim();
}

Deno.serve(async (req) => {
  /*
   * ============================================
   * OPTIONS / CORS
   * ============================================
   */

  if (req.method === "OPTIONS") {
    return new Response("ok", {
      status: 200,
      headers: corsHeaders,
    });
  }

  /*
   * ============================================
   * Only POST
   * ============================================
   */

  if (req.method !== "POST") {
    return jsonResponse(
      {
        ok: false,
        error: "Method not allowed",
      },
      405,
    );
  }

  try {
    /*
     * ============================================
     * Environment variables
     * ============================================
     */

    const supabaseUrl =
      Deno.env.get("SUPABASE_URL");

    const supabaseServiceRoleKey =
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    const openaiApiKey =
      Deno.env.get("OPENAI_API_KEY");

    if (!supabaseUrl) {
      throw new Error(
        "Missing SUPABASE_URL environment variable",
      );
    }

    if (!supabaseServiceRoleKey) {
      throw new Error(
        "Missing SUPABASE_SERVICE_ROLE_KEY environment variable",
      );
    }

    if (!openaiApiKey) {
      throw new Error(
        "Missing OPENAI_API_KEY environment variable",
      );
    }

    /*
     * ============================================
     * Create Supabase admin client
     *
     * Service role key MUST remain inside
     * Edge Function.
     * NEVER put this key in index.html.
     * ============================================
     */

    const supabase = createClient(
      supabaseUrl,
      supabaseServiceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    );

    /*
     * ============================================
     * Read request body
     * ============================================
     */

    let body: Record<string, unknown>;

    try {
      body = await req.json();
    } catch {
      return jsonResponse(
        {
          ok: false,
          error: "Invalid JSON request body",
        },
        400,
      );
    }

    const womanId = cleanText(
      body?.woman_id,
    );

    const language = normalizeLanguage(
      body?.language,
    );

    /*
     * ============================================
     * Validate parameters
     * ============================================
     */

    if (!womanId) {
      return jsonResponse(
        {
          ok: false,
          error: "woman_id is required",
        },
        400,
      );
    }

    if (!language) {
      return jsonResponse(
        {
          ok: false,
          error:
            "Unsupported language. Supported languages: en, zh-CN, zh-TW, ja, ru",
        },
        400,
      );
    }

    /*
     * ============================================
     * Get woman
     * ============================================
     */

    const {
      data: woman,
      error: womanError,
    } = await supabase
      .from("women")
      .select(`
        id,
        name,
        description,
        occupation,
        hobbies,
        interests
      `)
      .eq("id", womanId)
      .maybeSingle();

    if (womanError) {
      console.error(
        "Supabase woman query error:",
        womanError,
      );

      return jsonResponse(
        {
          ok: false,
          error: "Failed to read profile",
          details: womanError.message,
        },
        500,
      );
    }

    if (!woman) {
      return jsonResponse(
        {
          ok: false,
          error: "Profile not found",
        },
        404,
      );
    }

    /*
     * ============================================
     * Determine source fields
     * ============================================
     */

    const description = cleanText(
      woman.description,
    );

    const occupation = cleanText(
      woman.occupation,
    );

    /*
     * Some existing databases may use hobbies
     * while newer versions use interests.
     *
     * Support both.
     */

    const interests = cleanText(
      woman.interests || woman.hobbies,
    );

    /*
     * ============================================
     * Determine translated columns
     * ============================================
     */

    const descriptionColumn =
      languageColumn(
        "description",
        language,
      );

    const occupationColumn =
      languageColumn(
        "occupation",
        language,
      );

    const interestsColumn =
      languageColumn(
        "interests",
        language,
      );

    /*
     * ============================================
     * Read existing translations
     * ============================================
     */

    const {
      data: cached,
      error: cachedError,
    } = await supabase
      .from("women")
      .select(`
        ${descriptionColumn},
        ${occupationColumn},
        ${interestsColumn}
      `)
      .eq("id", womanId)
      .maybeSingle();

    if (cachedError) {
      console.error(
        "Supabase cache query error:",
        cachedError,
      );

      return jsonResponse(
        {
          ok: false,
          error: "Failed to read translation cache",
          details: cachedError.message,
        },
        500,
      );
    }

    /*
     * ============================================
     * Check whether all translations exist
     * ============================================
     */

    const cachedDescription =
      cleanText(
        cached?.[descriptionColumn],
      );

    const cachedOccupation =
      cleanText(
        cached?.[occupationColumn],
      );

    const cachedInterests =
      cleanText(
        cached?.[interestsColumn],
      );

    const descriptionReady =
      !description || !!cachedDescription;

    const occupationReady =
      !occupation || !!cachedOccupation;

    const interestsReady =
      !interests || !!cachedInterests;

    /*
     * If everything exists, don't call the
     * translation API again.
     */

    if (
      descriptionReady &&
      occupationReady &&
      interestsReady
    ) {
      return jsonResponse({
        ok: true,
        cached: true,
        language,
        woman_id: womanId,
        translation: {
          description:
            cachedDescription,
          occupation:
            cachedOccupation,
          interests:
            cachedInterests,
        },
      });
    }

    /*
     * ============================================
     * Translate missing fields only
     * ============================================
     */

    let translatedDescription =
      cachedDescription;

    let translatedOccupation =
      cachedOccupation;

    let translatedInterests =
      cachedInterests;

    if (
      description &&
      !cachedDescription
    ) {
      translatedDescription =
        await translateText(
          description,
          language,
          openaiApiKey,
        );
    }

    if (
      occupation &&
      !cachedOccupation
    ) {
      translatedOccupation =
        await translateText(
          occupation,
          language,
          openaiApiKey,
        );
    }

    if (
      interests &&
      !cachedInterests
    ) {
      translatedInterests =
        await translateText(
          interests,
          language,
          openaiApiKey,
        );
    }

    /*
     * ============================================
     * Save translations to Supabase
     * ============================================
     */

    const updateData: Record<
      string,
      string | null
    > = {};

    if (description) {
      updateData[descriptionColumn] =
        translatedDescription || null;
    }

    if (occupation) {
      updateData[occupationColumn] =
        translatedOccupation || null;
    }

    if (interests) {
      updateData[interestsColumn] =
        translatedInterests || null;
    }

    const {
      error: updateError,
    } = await supabase
      .from("women")
      .update(updateData)
      .eq("id", womanId);

    if (updateError) {
      console.error(
        "Supabase translation save error:",
        updateError,
      );

      return jsonResponse(
        {
          ok: false,
          error:
            "Translation succeeded but saving failed",
          details: updateError.message,
          translation: {
            description:
              translatedDescription,
            occupation:
              translatedOccupation,
            interests:
              translatedInterests,
          },
        },
        500,
      );
    }

    /*
     * ============================================
     * Return translated profile
     * ============================================
     */

    return jsonResponse({
      ok: true,
      cached: false,
      language,
      woman_id: womanId,
      translation: {
        description:
          translatedDescription,
        occupation:
          translatedOccupation,
        interests:
          translatedInterests,
      },
    });
  } catch (error) {
    console.error(
      "translate-profile error:",
      error,
    );

    return jsonResponse(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown server error",
      },
      500,
    );
  }
});
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Popular Goodreads categories with shelf URLs
const CATEGORIES = [
  { id: "self-help", name: "Self-Help", shelf: "self-help" },
  { id: "philosophy", name: "Philosophy", shelf: "philosophy" },
  { id: "psychology", name: "Psychology", shelf: "psychology" },
  { id: "business", name: "Business", shelf: "business" },
  { id: "science", name: "Science", shelf: "science" },
  { id: "biography", name: "Biography", shelf: "biography" },
  { id: "history", name: "History", shelf: "history" },
  { id: "fiction", name: "Fiction", shelf: "fiction" },
  { id: "spirituality", name: "Spirituality", shelf: "spirituality" },
  { id: "economics", name: "Economics", shelf: "economics" },
  { id: "leadership", name: "Leadership", shelf: "leadership" },
  { id: "productivity", name: "Productivity", shelf: "productivity" },
];

async function fetchPage(url: string): Promise<string> {
  console.log("Fetching:", url);
  const resp = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.5",
    },
  });
  if (!resp.ok) {
    throw new Error(`Failed to fetch ${url}: ${resp.status}`);
  }
  return await resp.text();
}

function extractTextBetween(html: string, startMarker: string, endMarker: string): string {
  const startIdx = html.indexOf(startMarker);
  if (startIdx === -1) return "";
  const afterStart = startIdx + startMarker.length;
  const endIdx = html.indexOf(endMarker, afterStart);
  if (endIdx === -1) return "";
  return html.slice(afterStart, endIdx).trim();
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ").trim();
}

function extractBooksFromSearchHtml(html: string): Array<{ title: string; author: string; url: string; rating?: string }> {
  const books: Array<{ title: string; author: string; url: string; rating?: string }> = [];
  
  // Extract from table rows - Goodreads search results
  const trPattern = /<tr[^>]*>[\s\S]*?<\/tr>/gi;
  const rows = html.match(trPattern) || [];
  
  for (const row of rows) {
    // Extract title and URL
    const titleMatch = row.match(/<a[^>]*class="bookTitle"[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/i);
    if (!titleMatch) continue;
    
    const url = titleMatch[1].startsWith("http") ? titleMatch[1] : `https://www.goodreads.com${titleMatch[1]}`;
    const title = stripHtml(titleMatch[2]);
    
    // Extract author
    const authorMatch = row.match(/<a[^>]*class="authorName"[^>]*>([\s\S]*?)<\/a>/i);
    const author = authorMatch ? stripHtml(authorMatch[1]) : "Unknown";
    
    // Extract rating
    const ratingMatch = row.match(/(\d\.\d{2})\s*avg rating/i);
    const rating = ratingMatch ? ratingMatch[1] : undefined;
    
    if (title) {
      books.push({ title, author, url, rating });
    }
  }
  
  // Fallback: try anchor-based extraction
  if (books.length === 0) {
    const linkPattern = /<a[^>]*href="(\/book\/show\/[^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;
    let match;
    const seen = new Set<string>();
    while ((match = linkPattern.exec(html)) !== null) {
      const url = `https://www.goodreads.com${match[1]}`;
      const title = stripHtml(match[2]);
      if (title && title.length > 2 && title.length < 200 && !seen.has(url)) {
        seen.add(url);
        books.push({ title, author: "", url });
      }
    }
  }
  
  return books.slice(0, 20);
}

async function extractBookDetails(url: string, apiKey: string): Promise<any> {
  try {
    const html = await fetchPage(url);
    
    // Extract key info from page for AI processing
    const titleMatch = html.match(/<h1[^>]*class="[^"]*Text__title1[^"]*"[^>]*>([\s\S]*?)<\/h1>/i) 
      || html.match(/<h1[^>]*id="bookTitle"[^>]*>([\s\S]*?)<\/h1>/i);
    const title = titleMatch ? stripHtml(titleMatch[1]) : "";
    
    const authorMatch = html.match(/<span[^>]*class="[^"]*ContributorLink__name[^"]*"[^>]*>([\s\S]*?)<\/span>/i)
      || html.match(/<a[^>]*class="authorName"[^>]*>([\s\S]*?)<\/a>/i);
    const author = authorMatch ? stripHtml(authorMatch[1]) : "";
    
    // Get description
    const descMatch = html.match(/<div[^>]*class="[^"]*DetailsLayoutRightParagraph[^"]*"[^>]*>([\s\S]*?)<\/div>/i)
      || html.match(/<div[^>]*id="description"[^>]*>([\s\S]*?)<\/div>/i);
    const description = descMatch ? stripHtml(descMatch[1]).slice(0, 1000) : "";
    
    // Get genres
    const genrePattern = /<span[^>]*class="[^"]*BookPageMetadataSection__genreButton[^"]*"[^>]*>[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>/gi;
    const genres: string[] = [];
    let gMatch;
    while ((gMatch = genrePattern.exec(html)) !== null) {
      genres.push(stripHtml(gMatch[1]));
    }
    
    // Get rating
    const ratingMatch = html.match(/<div[^>]*class="[^"]*RatingStatistics__rating[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
    const rating = ratingMatch ? stripHtml(ratingMatch[1]) : "";
    
    // Use AI to generate a complete book advisor profile
    const bookContext = `Title: ${title}\nAuthor: ${author}\nDescription: ${description}\nGenres: ${genres.join(', ')}\nRating: ${rating}\nURL: ${url}`;
    
    console.log("Extracted book context:", bookContext.slice(0, 200));
    
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: "You are a JSON generator. Always respond with valid JSON only, no markdown, no code blocks. Just the raw JSON object.",
          },
          {
            role: "user",
            content: `Given this book information scraped from Goodreads, generate a complete book advisor profile for an AI chatbot.

${bookContext}

Return a JSON object with these fields:
- title: The book's full title
- author: The author's name  
- description: 1-2 sentence description of the book and its core message
- cover_emoji: A single emoji that represents the book's theme
- color: A Tailwind CSS gradient string (e.g., "from-amber-500 to-orange-700")
- system_prompt: A detailed system prompt (200-400 words) that makes an AI embody this book's wisdom. Include the key teachings, core concepts, and how to guide users. The AI should speak as a wise guide who deeply understands this book.
- key_concepts: Array of 5-8 key concepts/teachings from the book
- genres: Array of 2-3 genres
- language: "en" or appropriate language
- wiki_url: "${url}"

Be accurate to the book's actual content and teachings.`,
          },
        ],
      }),
    });

    if (!aiResponse.ok) {
      console.error("AI error:", aiResponse.status);
      // Return basic info without AI enrichment
      return { title, author, description, genres, url, needsGeneration: true };
    }

    const aiData = await aiResponse.json();
    let content = aiData.choices?.[0]?.message?.content || "";
    content = content.trim();
    if (content.startsWith("```")) {
      content = content.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }
    
    return JSON.parse(content);
  } catch (error) {
    console.error("Error extracting book details:", error);
    throw error;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, query, url, category } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Action: list categories
    if (action === "categories") {
      return new Response(JSON.stringify({ categories: CATEGORIES }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Action: search books
    if (action === "search" && query) {
      const searchUrl = `https://www.goodreads.com/search?q=${encodeURIComponent(query)}&search_type=books`;
      const html = await fetchPage(searchUrl);
      const books = extractBooksFromSearchHtml(html);
      
      return new Response(JSON.stringify({ books }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Action: browse category
    if (action === "browse" && category) {
      const categoryUrl = `https://www.goodreads.com/shelf/show/${encodeURIComponent(category)}`;
      const html = await fetchPage(categoryUrl);
      const books = extractBooksFromSearchHtml(html);
      
      return new Response(JSON.stringify({ books }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Action: import a specific book (from URL or selected result)
    if (action === "import" && url) {
      const bookData = await extractBookDetails(url, LOVABLE_API_KEY);
      
      return new Response(JSON.stringify({ book: bookData }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ error: "Invalid action. Use: categories, search, browse, or import" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Goodreads import error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

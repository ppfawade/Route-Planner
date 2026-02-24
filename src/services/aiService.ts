import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function getTripAdvice(
  start: string,
  end: string,
  vehicleType: 'EV' | 'ICE',
  distanceKm: number
): Promise<string> {
  try {
    const prompt = `
      I am planning a trip from ${start} to ${end} in a ${vehicleType === 'EV' ? 'Electric Vehicle' : 'Combustion Engine Vehicle'}.
      The distance is approximately ${distanceKm} km.
      
      Please provide a brief, helpful summary for this trip including:
      1. Estimated travel time (assuming average highway speeds).
      2. Key cities or landmarks to look out for on the way.
      3. ${vehicleType === 'EV' ? 'Advice on charging stops (e.g. suggest stopping every 200-300km).' : 'Advice on fuel efficiency or rest stops.'}
      4. One interesting fun fact about the region I'm driving through.
      
      Keep the tone friendly and the response concise (under 200 words).
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });

    return response.text || "Could not generate trip advice at this time.";
  } catch (error) {
    console.error("Error generating trip advice:", error);
    return "Sorry, I couldn't generate advice for this trip right now.";
  }
}

export async function getGeographicalFeatures(
  start: string,
  end: string
): Promise<string[]> {
  try {
    const prompt = `
      Identify 3-5 major geographical features (mountains, rivers, national parks, deserts, etc.) that one would encounter or pass near when driving from ${start} to ${end}.
      Return ONLY a JSON array of strings. Example: ["Rocky Mountains", "Colorado River", "Great Plains"].
      Do not include any other text.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = response.text;
    if (!text) return [];
    return JSON.parse(text);
  } catch (error) {
    console.error("Error generating geographical features:", error);
    return [];
  }
}

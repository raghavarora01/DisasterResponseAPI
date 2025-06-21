import axios from 'axios';
import supabase from '../models/supabase.js';
import dotenv from 'dotenv';

dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const MAPBOX_API_KEY = process.env.MAPBOX_API_KEY;

const getCachedValue = async (key) => {
  const { data, error } = await supabase
    .from('cache')
    .select('value, expires_at')
    .eq('key', key)
    .single();

  if (error || !data) return null;

  const now = new Date();
  const expiresAt = new Date(data.expires_at);
  if (now > expiresAt) return null;

  return data.value;
};

const setCachedValue = async (key, value) => {
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour TTL
  await supabase
    .from('cache')
    .upsert({ key, value, expires_at: expiresAt.toISOString() });
};

export const extractLocationFromDescription = async (description) => {
  const prompt = `Extract location name from this disaster description: "${description}"`;

  const cached = await getCachedValue(`gemini_location:${description}`);
  if (cached) return cached;

  const response = await axios.post(
    'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent',
    {
      contents: [{ parts: [{ text: prompt }] }]
    },
    {
      params: { key: GEMINI_API_KEY },
      headers: { 'Content-Type': 'application/json' }
    }
  );

  const location = response.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  if (!location) throw new Error('Failed to extract location from Gemini.');

  await setCachedValue(`gemini_location:${description}`, location);
  return location;
};

export const geocodeLocation = async (locationName) => {
  const cached = await getCachedValue(`geocode:${locationName}`);
  if (cached) return cached;

  const response = await axios.get(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(locationName)}.json`,
    {
      params: {
        access_token: MAPBOX_API_KEY,
        limit: 1
      }
    }
  );

  const [longitude, latitude] = response.data?.features?.[0]?.center || [];
  if (!latitude || !longitude) throw new Error('Failed to geocode location.');

  const result = { lat: latitude, lng: longitude };
  await setCachedValue(`geocode:${locationName}`, result);
  return result;
};

// POST /geocode
const geocodeHandler = async (req, res) => {
  const { description } = req.body;

  if (!description || typeof description !== 'string') {
    return res.status(400).json({ error: 'Description is required and must be a string.' });
  }

  try {
    const locationName = await extractLocationFromDescription(description);
    const coordinates = await geocodeLocation(locationName);

    return res.status(200).json({
      location_name: locationName,
      coordinates
    });
  } catch (err) {
    console.error('Error in geocodeHandler:', err.message);
    return res.status(500).json({ error: 'Failed to extract or geocode location.' });
  }
};

export default { geocodeHandler  };

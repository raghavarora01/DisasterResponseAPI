
import supabase from "../models/supabase.js";
export const getNearbyResources = async (req, res) => {
  const { id } = req.params;
  const { lat, lon } = req.query;

  if (!lat || !lon) {
    return res.status(400).json({ error: 'Latitude and longitude are required.' });
  }

  try {
    const { data, error } = await supabase.rpc('get_nearby_resources', {
      disaster_id_input: parseInt(id),
      user_lat: parseFloat(lat),
      user_lon: parseFloat(lon),
      radius_meters: 10000 // Default radius of 10km
    });

    if (error) throw error;

    // Emit socket event for real-time updates
    const io = req.app.get('io');
    io.emit('resources_updated', {
      disasterId: id,
      resources: data,
      timestamp: new Date().toISOString()
    });

    res.status(200).json({ resources: data });
  } catch (err) {
    console.error('Error fetching nearby resources:', err.message);
    res.status(500).json({ error: 'Failed to fetch nearby resources.' });
  }
};

export const getAllResources = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('resources')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching resources:', error.message);
    res.status(500).json({ error: 'Failed to fetch resources' });
  }
};

export const createResource = async (req, res) => {
  const { disaster_id, name, location_name, type } = req.body;
  const user = req.user;

  if (!disaster_id || !name || !location_name || !type) {
    return res.status(400).json({ error: 'Missing required fields: disaster_id, name, location_name, type' });
  }

  try {
    // Geocode the location if latitude/longitude aren't provided
    let coordinates = { lat: null, lng: null };
    if (!req.body.latitude || !req.body.longitude) {
      coordinates = await geocodeLocation(location_name);
    } else {
      coordinates = { lat: parseFloat(req.body.latitude), lng: parseFloat(req.body.longitude) };
    }
    const locationPoint = `POINT(${coordinates.lng} ${coordinates.lat})`;

    const resourceEntry = {
      disaster_id: parseInt(disaster_id),
      name,
      location_name,
      location: locationPoint,
      type,
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('resources')
      .insert(resourceEntry)
      .select()
      .single();

    if (error) throw error;

    const io = req.app.get('io');
    io.emit('resources_updated', {
      disasterId: disaster_id,
      resources: [data],
      timestamp: new Date().toISOString()
    });

    res.status(201).json(data);
  } catch (error) {
    console.error('Error creating resource:', error.message);
    res.status(500).json({ error: 'Failed to create resource' });
  }
};

export default { getNearbyResources, getAllResources, createResource };

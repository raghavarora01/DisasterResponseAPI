

import supabase from '../models/supabase.js'; // Keep for fallback/reference
import { extractLocationFromDescription, geocodeLocation } from './geocode.js';

const createDisaster = async (req, res) => {
  let { title, location_name, description, tags } = req.body;
  const user = req.user;
  const appSupabase = req.app.get('supabase'); // Primary source

  // Fallback to imported supabase if app context fails
  const supabase = appSupabase || (supabase && typeof supabase.from === 'function' ? supabase : null);
  if (!supabase) {
    console.error('Supabase client is not available');
    return res.status(500).json({ error: 'Internal server error: Supabase client unavailable.' });
  }

  if (!title || typeof title !== 'string' || title.trim() === '') {
    return res.status(400).json({ error: 'Title is required and must be a non-empty string.' });
  }

  if (tags && !Array.isArray(tags)) {
    return res.status(400).json({ error: 'Tags must be an array of strings.' });
  }

  try {
    if (!location_name || location_name.trim() === '') {
      location_name = await extractLocationFromDescription(description);
      if (!location_name) throw new Error('Failed to extract location from description.');
    }

    const coordinates = await geocodeLocation(location_name);
    if (!coordinates.lat || !coordinates.lng) throw new Error('Failed to geocode location.');
    const locationPoint = `POINT(${coordinates.lng} ${coordinates.lat})`;

    const disasterEntry = {
      title,
      location_name,
      location: locationPoint,
      latitude: coordinates.lat,
      longitude: coordinates.lng,
      description,
      tags,
      owner_id: user.user_id,
      audit_trail: [
        {
          action: 'create',
          user_id: user.user_id,
          timestamp: new Date().toISOString(),
        },
      ],
    };

    const { data: disasterData, error: disasterError } = await supabase
      .from('disasters')
      .insert(disasterEntry)
      .select()
      .single();

    if (disasterError) throw disasterError;

    // Automatically create a dynamic default resource for the disaster
    const resourceName = `${disasterData.title} Relief Center ${new Date().toISOString().split('T')[0]}`;
    const resourceType = tags && tags.some(tag => tag.match(/flood/i)) ? 'Flood Relief' :
                       tags && tags.some(tag => tag.match(/earthquake/i)) ? 'Earthquake Relief' :
                       'General Relief';
    const offsetMeters = 100;
    const offsetLocation = await supabase.rpc('offset_geography_point', {
      point: locationPoint,
      distance_meters: offsetMeters,
      bearing_degrees: 90
    }).single().then(result => result.data).catch(() => null);

    const resourceEntry = {
      disaster_id: disasterData.id,
      name: resourceName,
      location_name: `${disasterData.location_name} - Relief Hub`,
      location: offsetLocation || locationPoint,
      type: resourceType,
    };

    const { data: resourceData, error: resourceError } = await supabase
      .from('resources')
      .insert(resourceEntry);

    if (resourceError) {
      console.warn('Failed to create default resource, but disaster was created:', resourceError.message);
    } else {
      req.app.get('io').emit('resources_updated', { disasterId: disasterData.id, resources: resourceData });
    }

    req.app.get('io').emit('disaster_updated', disasterData);

    return res.status(201).json({
      message: 'Disaster created successfully with auto-geocoded location.',
      disaster: disasterData,
    });
  } catch (err) {
    console.error('Error creating disaster with geocoding:', err.message);
    return res.status(500).json({ error: 'Failed to create disaster. Please try again.' });
  }
};

const updateDisaster = async (req, res) => {
  const { id } = req.params;
  const { title, description, tags } = req.body;
  const user = req.user;
  const supabase = req.app.get('supabase');

  if (!supabase) {
    console.error('Supabase client is not available');
    return res.status(500).json({ error: 'Internal server error: Supabase client unavailable.' });
  }

  const updatedFields = {
    ...(title && { title }),
    ...(description && { description }),
    ...(tags && { tags }),
    audit_trail: [
      {
        action: 'update',
        user_id: user.user_id,
        timestamp: new Date().toISOString(),
      },
    ],
  };

  try {
    const { data, error } = await supabase
      .from('disasters')
      .update(updatedFields)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    req.app.get('io').emit('disaster_updated', data);
    res.status(200).json({ message: 'Disaster updated.', disaster: data });
  } catch (err) {
    console.error('Error updating disaster:', err.message);
    res.status(500).json({ error: 'Failed to update disaster.' });
  }
};

const getDisasters = async (req, res) => {
  const tag = req.query.tag;
  const supabase = req.app.get('supabase');

  if (!supabase) {
    console.error('Supabase client is not available');
    return res.status(500).json({ error: 'Internal server error: Supabase client unavailable.' });
  }

  let query = supabase.from('disasters').select('*');

  if (tag) {
    query = query.contains('tags', [tag]);
  }

  try {
    const { data, error } = await query;
    if (error) throw error;
    res.status(200).json(data);
  } catch (err) {
    console.error('Error fetching disasters:', err.message);
    res.status(500).json({ error: 'Failed to fetch disasters.' });
  }
};

const deleteDisaster = async (req, res) => {
  const { id } = req.params;
  const supabase = req.app.get('supabase');

  if (!supabase) {
    console.error('Supabase client is not available');
    return res.status(500).json({ error: 'Internal server error: Supabase client unavailable.' });
  }

  try {
    const { error } = await supabase.from('disasters').delete().eq('id', id);
    if (error) throw error;

    req.app.get('io').emit('disaster_updated', { deleted: id });
    res.status(200).json({ message: 'Disaster deleted.' });
  } catch (err) {
    console.error('Error deleting disaster:', err.message);
    res.status(500).json({ error: 'Failed to delete disaster.' });
  }
};

export default { createDisaster, updateDisaster, getDisasters, deleteDisaster };

import supabase from '../models/supabase.js';
import { extractLocationFromDescription, geocodeLocation } from './geocode.js';

// const createDisaster = async (req, res) => {
//   const { title, location_name, description, tags } = req.body;
//   const user = req.user;

//   // Basic validations
//   if (!title || typeof title !== 'string' || title.trim() === '') {
//     return res.status(400).json({ error: 'Title is required and must be a non-empty string.' });
//   }

//   if (tags && !Array.isArray(tags)) {
//     return res.status(400).json({ error: 'Tags must be an array of strings.' });
//   }

//   const disasterEntry = {
//     title,
//     location_name,
//     description,
//     tags,
//     owner_id: user.user_id,
//     audit_trail: [
//       {
//         action: 'create',
//         user_id: user.user_id,
//         timestamp: new Date().toISOString(),
//       },
//     ],
//   };

//   try {
//     const { data, error } = await supabase
//       .from('disasters')
//       .insert(disasterEntry)
//       .select()
//       .single();

//     if (error) throw error;

//     // Emit real-time update via socket.io
//     req.app.get('io').emit('disaster_updated', data);

//     return res.status(201).json({
//       message: 'Disaster created successfully.',
//       disaster: data,
//     });
//   } catch (err) {
//     console.error('Error inserting disaster:', err.message);
//     return res.status(500).json({ error: 'Failed to create disaster. Please try again later.' });
//   }
// };
// const createDisaster = async (req, res) => {
//   let { title, location_name, description, tags } = req.body;
//   const user = req.user;

//   if (!title || typeof title !== 'string' || title.trim() === '') {
//     return res.status(400).json({ error: 'Title is required and must be a non-empty string.' });
//   }

//   if (tags && !Array.isArray(tags)) {
//     return res.status(400).json({ error: 'Tags must be an array of strings.' });
//   }

//   try {
//     if (!location_name || location_name.trim() === '') {
//       location_name = await extractLocationFromDescription(description);
//     }

//     const coordinates = await geocodeLocation(location_name);

//     // ✅ Format for PostGIS geography(Point, 4326)
// // Make sure you pass as WKT (Well-Known Text) string
// const locationPoint = `POINT(${coordinates.lng} ${coordinates.lat})`;

//     const disasterEntry = {
//       title,
//       location_name,
//       location: locationPoint,
//        latitude: coordinates.lat,  // store directly
//       longitude: coordinates.lng,
//       description,
//       tags,
//       owner_id: user.user_id,
//       audit_trail: [
//         {
//           action: 'create',
//           user_id: user.user_id,
//           timestamp: new Date().toISOString(),
//         },
//       ],
//     };

//     const { data, error } = await supabase
//       .from('disasters')
//       .insert(disasterEntry)
//       .select()
//       .single();

//     if (error) throw error;

//     req.app.get('io').emit('disaster_updated', data);

//     return res.status(201).json({
//       message: 'Disaster created successfully with auto-geocoded location.',
//       disaster: data,
//     });
//   } catch (err) {
//     console.error('Error creating disaster with geocoding:', err.message);
//     return res.status(500).json({ error: 'Failed to create disaster. Please try again.' });
//   }
// };



// // GET /disasters?tag=optional
const getDisasters = async (req, res) => {
  const tag = req.query.tag;
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

// disastersController.js

const createDisaster = async (req, res) => {
  let { title, location_name, description, tags } = req.body;
  const user = req.user;

  if (!title || typeof title !== 'string' || title.trim() === '') {
    return res.status(400).json({ error: 'Title is required and must be a non-empty string.' });
  }

  if (tags && !Array.isArray(tags)) {
    return res.status(400).json({ error: 'Tags must be an array of strings.' });
  }

  try {
    if (!location_name || location_name.trim() === '') {
      location_name = await extractLocationFromDescription(description);
    }

    const coordinates = await geocodeLocation(location_name);
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

    // Automatically create a default resource for the disaster
    const resourceEntry = {
      disaster_id: disasterData.id,
      name: 'Default Relief Center',
      location_name: disasterData.location_name,
      location: locationPoint, // Use the same location as the disaster
      type: 'Relief',
    };

    const { data: resourceData, error: resourceError } = await supabase
      .from('resources')
      .insert(resourceEntry);

    if (resourceError) {
      console.warn('Failed to create default resource, but disaster was created:', resourceError.message);
      // Continue even if resource creation fails, as disaster is the priority
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


 const deleteDisaster = async (req, res) => {
  const { id } = req.params;

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


export default {createDisaster, updateDisaster, getDisasters, deleteDisaster};

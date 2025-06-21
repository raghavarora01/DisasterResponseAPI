// In-memory store for resources (replace with database in production)
let resources = [
  {
    id: '1',
    disaster_id: '1',
    name: 'Red Cross Shelter',
    type: 'shelter',
    location_name: 'Downtown Community Center',
    latitude: 40.7128,
    longitude: -74.0060,
    created_at: new Date().toISOString()
  },
  {
    id: '2',
    disaster_id: '1',
    name: 'Downtown Hospital',
    type: 'hospital',
    location_name: '123 Main St, New York, NY',
    latitude: 40.7110,
    longitude: -74.0080,
    created_at: new Date(Date.now() - 3600000).toISOString()
  }
];

// Mock Supabase for now - replace with actual import when available
const supabase = {
  rpc: async (fn, params) => {
    // For get_nearby_resources function
    if (fn === 'get_nearby_resources') {
      const { disaster_id_input, user_lat, user_lon, radius_meters } = params;
      
      // Simple distance calculation (in km)
      const calculateDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371; // Earth's radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = 
          Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
          Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
      };

      // Filter resources by disaster ID and calculate distances
      const nearbyResources = resources
        .filter(resource => resource.disaster_id === disaster_id_input.toString())
        .map(resource => ({
          ...resource,
          distance: calculateDistance(
            user_lat, 
            user_lon, 
            resource.latitude, 
            resource.longitude
          )
        }))
        .filter(resource => resource.distance <= (radius_meters || 10000) / 1000); // Convert meters to km

      return { 
        data: nearbyResources,
        error: null 
      };
    }
    
    return { data: null, error: 'Function not implemented' };
  },
  
  from: () => ({
    insert: async (data) => {
      const newResource = {
        id: (resources.length + 1).toString(),
        ...data,
        created_at: new Date().toISOString()
      };
      resources.push(newResource);
      return { data: [newResource], error: null };
    },
    select: () => ({
      order: () => ({
        data: resources,
        error: null
      })
    })
  })
};

// GET /api/disasters/:id/resources?lat=...&lon=...
const getNearbyResources = async (req, res) => {
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
      radius_meters: 10000 // optional
    });

    if (error) throw error;

    // Emit socket event
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

// GET /api/resources - Get all resources
const getAllResources = async (req, res) => {
  try {
    // In a real app, you would fetch from your database here
    res.json(resources);
  } catch (error) {
    console.error('Error fetching resources:', error);
    res.status(500).json({ error: 'Failed to fetch resources' });
  }
};

// POST /api/resources - Create a new resource
const createResource = async (req, res) => {
  try {
    const { disaster_id, name, location_name, type } = req.body;
    
    if (!disaster_id || !name || !location_name || !type) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // In a real app, you would save to your database here
    const newResource = {
      id: (resources.length + 1).toString(),
      disaster_id,
      name,
      location_name,
      type,
      created_at: new Date().toISOString()
    };
    
    resources.push(newResource);
    
    res.status(201).json(newResource);
  } catch (error) {
    console.error('Error creating resource:', error);
    res.status(500).json({ error: 'Failed to create resource' });
  }
};

export { 
  getNearbyResources,
  getAllResources,
  createResource
};

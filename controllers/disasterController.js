// Mock database
let disasters = [];

const disasterController = {
  // Create a new disaster
  createDisaster: (req, res) => {
    const disaster = {
      id: Date.now().toString(),
      ...req.body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    disasters.push(disaster);
    
    // Emit socket event
    const io = req.app.get('io');
    io.emit('disaster_updated', disaster);
    
    res.status(201).json(disaster);
  },
  
  // Get all disasters
  getDisasters: (req, res) => {
    res.json(disasters);
  },
  
  // Update a disaster
  updateDisaster: (req, res) => {
    const { id } = req.params;
    const index = disasters.findIndex(d => d.id === id);
    
    if (index === -1) {
      return res.status(404).json({ error: 'Disaster not found' });
    }
    
    const updatedDisaster = {
      ...disasters[index],
      ...req.body,
      updatedAt: new Date().toISOString()
    };
    
    disasters[index] = updatedDisaster;
    
    // Emit socket event
    const io = req.app.get('io');
    io.emit('disaster_updated', updatedDisaster);
    
    res.json(updatedDisaster);
  },
  
  // Delete a disaster
  deleteDisaster: (req, res) => {
    const { id } = req.params;
    const index = disasters.findIndex(d => d.id === id);
    
    if (index === -1) {
      return res.status(404).json({ error: 'Disaster not found' });
    }
    
    const [deletedDisaster] = disasters.splice(index, 1);
    
    // Emit socket event
    const io = req.app.get('io');
    io.emit('disaster_updated', { ...deletedDisaster, deleted: true });
    
    res.status(204).send();
  }
};

export default disasterController;

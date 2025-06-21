// Mock Gemini service for now - replace with actual import when available
const verifyImageWithGemini = async (imageUrl) => {
  // Simulate API call
  return new Promise((resolve) => {
    setTimeout(() => {
      // Mock response - in reality, this would call the Gemini API
      const responses = [
        'This image appears to be authentic and shows signs of a real disaster.',
        'This image shows signs of manipulation or AI generation.',
        'Unable to determine authenticity with high confidence.'
      ];
      resolve(responses[Math.floor(Math.random() * responses.length)]);
    }, 1000);
  });
};

// Mock Supabase for now - replace with actual import when available
const supabase = {
  from: () => ({
    select: () => ({
      eq: () => ({
        single: async () => ({
          data: { audit_trail: [] },
          error: null
        })
      })
    }),
    update: (data) => ({
      eq: () => ({
        select: () => ({
          single: async () => ({
            data: { ...data, id: 'mock-report-id' },
            error: null
          })
        })
      })
    })
  })
};

const verifyDisasterImage = async (req, res) => {
  const { id } = req.params; // optional (can be disaster ID)
  const { image_url, report_id } = req.body;
  const user = req.user || { user_id: 'system' };

  if (!image_url || !report_id) {
    return res.status(400).json({ error: 'Image URL and report_id are required.' });
  }

  try {
    // 1. Get full result from Gemini API
    const verification_status = await verifyImageWithGemini(image_url);

    // 2. Determine simplified verification label
    let verification_label = 'uncertain';
    const text = verification_status.toLowerCase();
    if (text.includes('authentic') || text.includes('genuine') || text.includes('real')) {
      verification_label = 'authentic';
    } else if (text.includes('manipulated') || text.includes('fake') || text.includes('ai-generated')) {
      verification_label = 'manipulated';
    }

    // 3. Fetch existing audit trail (optional)
    const { data: existingReport, error: fetchError } = await supabase
      .from('reports')
      .select('audit_trail')
      .eq('id', report_id)
      .single();

    if (fetchError) throw fetchError;

    const previousAuditTrail = existingReport?.audit_trail || [];
    const auditEntry = {
      action: 'verify_image',
      label: verification_label,
      user_id: user.user_id,
      timestamp: new Date().toISOString(),
      image_url
    };

    // 4. Update report with verification_status and label
    const { data: updatedReport, error: updateError } = await supabase
      .from('reports')
      .update({
        verification_status,
        verification_label,
        audit_trail: [...previousAuditTrail, auditEntry],
        updated_at: new Date().toISOString()
      })
      .eq('id', report_id)
      .select()
      .single();

    if (updateError) throw updateError;

    // Emit socket event
    const io = req.app.get('io');
    io.emit('report_updated', {
      id: report_id,
      verification_status,
      verification_label,
      updated_at: updatedReport.updated_at
    });

    res.status(200).json({
      success: true,
      report: updatedReport,
      verification: {
        status: verification_status,
        label: verification_label
      }
    });
  } catch (error) {
    console.error('Error verifying image:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to verify image'
    });
  }
};

export { verifyDisasterImage };

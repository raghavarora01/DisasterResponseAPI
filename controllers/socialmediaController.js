// import bluesky from '../services/bluesky.js';
// import supabase from '../models/supabase.js';


// const getSocialMediaReports = async (req, res) => {
//   const disasterId = req.params.id;

//   try {
//     // Fetch disaster data (title, tags) from Supabase
//     const { data: disaster, error } = await supabase
//       .from('disasters')
//       .select('id, title, tags')
//       .eq('id', disasterId)
//       .single();

//     if (error || !disaster) {
//       return res.status(404).json({ error: 'Disaster not found' });
//     }

//     const keywords = [disaster.title, ...(disaster.tags || [])];

//     const allPosts = [];

//     for (const keyword of keywords) {
//       const posts = await bluesky.fetchBlueskyPosts(keyword);
//       allPosts.push(...posts);
//     }

//     // Deduplicate posts by URI + text
//     const seen = new Set();
//     const uniquePosts = allPosts.filter(post => {
//       const key = post.uri + post.text;
//       if (seen.has(key)) return false;
//       seen.add(key);
//       return true;
//     });

//     // Emit posts in real-time via Socket.IO
//     req.app.get('io').emit('social_reports', {
//       disasterId,
//       reports: uniquePosts,
//     });

//     res.status(200).json({ reports: uniquePosts });
//   } catch (err) {
//     console.error('Error fetching Bluesky reports:', err.message);
//     res.status(500).json({ error: 'Failed to fetch social media reports.' });
//   }
//   console.log('🔥 Social media controller hit for disaster:', disasterId);

// };
// export default getSocialMediaReports;
// import bluesky from '../services/bluesky.js';
// import supabase from '../models/supabase.js';

// const getSocialMediaReports = async (req, res) => {
//   const disasterId = req.params.id;

//   try {
//     const { data: disaster, error } = await supabase
//       .from('disasters')
//       .select('id, title, tags')
//       .eq('id', disasterId)
//       .single();

//     if (error || !disaster) {
//       return res.status(404).json({ error: 'Disaster not found' });
//     }

//     const rawKeywords = [disaster.title, ...(disaster.tags || [])];
//     const seenKeywords = new Set();
//     const allPosts = [];

//     for (const keyword of rawKeywords) {
//       const normalized = keyword.toLowerCase().trim();

//       if (seenKeywords.has(normalized)) continue;
//       seenKeywords.add(normalized);

//       if (seenKeywords.size > 5) break; // ✅ Limit to 5 unique keyword searches

//       const posts = await bluesky.fetchBlueskyPosts(normalized);
//       allPosts.push(...posts);
//     }

//     const seen = new Set();
//     const uniquePosts = allPosts.filter(post => {
//       const key = post.uri + post.text;
//       if (seen.has(key)) return false;
//       seen.add(key);
//       return true;
//     });

//     for (const post of uniquePosts) {
//       await supabase.from('reports').upsert({
//         disaster_id: disasterId,
//         user_id: post.author,
//         content: post.text,
//         image_url: null,
//         verification_status: 'pending',
//         created_at: post.timestamp
//       });
//     }

//     req.app.get('io').emit('social_media_updated', {
//       disasterId,
//       reports: uniquePosts
//     });

//     res.status(200).json({ reports: uniquePosts });
//   } catch (err) {
//     console.error('Error fetching Bluesky reports:', err.message);
//     res.status(500).json({ error: 'Failed to fetch social media reports.' });
//   }
// };
// const updateReport = async (req, res) => {
//   const { id } = req.params;
//   const updates = req.body;

//   try {
//     const { data, error } = await supabase
//       .from('reports')
//       .update(updates)
//       .eq('id', id)
//       .select()
//       .single();

//     if (error) throw error;

//     req.app.get('io').emit('report_updated', data); // optional real-time

//     res.status(200).json({ message: 'Report updated.', report: data });
//   } catch (err) {
//     console.error('Error updating report:', err.message);
//     res.status(500).json({ error: 'Failed to update report.' });
//   }
// };

// export  {getSocialMediaReports, updateReport};



// controllers/socialMediaController.js
import fetchBlueskyPosts from '../services/bluesky.js';
import supabase from '../models/supabase.js';

const getSocialMediaReports = async (req, res) => {
  const disasterId = req.params.id;

  try {
    const { data: disaster, error } = await supabase
      .from('disasters')
      .select('id, title, tags')
      .eq('id', disasterId)
      .single();

    if (error || !disaster) {
      return res.status(404).json({ error: 'Disaster not found' });
    }

    const rawKeywords = [disaster.title, ...(disaster.tags || [])];
    const seenKeywords = new Set();
    const allPosts = [];

    for (const keyword of rawKeywords) {
      const normalized = keyword.toLowerCase().trim();

      if (seenKeywords.has(normalized)) continue;
      seenKeywords.add(normalized);

      if (seenKeywords.size > 5) break;

      const posts = await fetchBlueskyPosts(normalized);
      allPosts.push(...posts);
    }

    const seen = new Set();
    const uniquePosts = allPosts.filter(post => {
      const key = post.uri + post.text;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    for (const post of uniquePosts) {
      await supabase.from('reports').upsert({
        disaster_id: disasterId,
        user_id: post.author,
        content: post.text,
        image_url: null,
        verification_status: 'pending',
        created_at: post.timestamp
      });
    }

    req.app.get('io').emit('social_media_updated', {
      disasterId,
      reports: uniquePosts
    });

    res.status(200).json({ reports: uniquePosts });
  } catch (err) {
    console.error('Error fetching Bluesky reports:', err.message);
    res.status(500).json({ error: 'Failed to fetch social media reports.' });
  }
};

const updateReport = async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  try {
    const { data, error } = await supabase
      .from('reports')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    req.app.get('io').emit('report_updated', data);

    res.status(200).json({ message: 'Report updated.', report: data });
  } catch (err) {
    console.error('Error updating report:', err.message);
    res.status(500).json({ error: 'Failed to update report.' });
  }
};

export { getSocialMediaReports, updateReport };

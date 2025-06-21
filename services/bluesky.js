// import { AtpAgent } from '@atproto/api';
// import dotenv from 'dotenv';

// dotenv.config();

// const agent = new AtpAgent({ service: 'https://bsky.social' });

// const loginToBluesky = async () => {
//   if (!agent.session) {
//     await agent.login({
//       identifier: process.env.BLUESKY_USERNAME,
//       password: process.env.BLUESKY_APP_PASSWORD,
//     });
//     console.log('✅ Logged in to Bluesky as', agent.session?.handle);
//   }
// };

// const fetchBlueskyPosts = async (keyword) => {
//   await loginToBluesky();

//   const { data } = await agent.app.bsky.feed.searchPosts({
//     q: keyword,
//     limit: 10,
//   });

//   const relevantPosts = (data.posts || []).map(post => ({
//     uri: post.uri,
//     cid: post.cid,
//     text: post.record.text,
//     author: post.author.handle,
//     timestamp: post.record.createdAt,
//   }));

//   console.log(`📡 Fetched ${relevantPosts.length} public posts for keyword "${keyword}"`);

//   return relevantPosts;
// };

// export default {
//   fetchBlueskyPosts
// };
// import { AtpAgent } from '@atproto/api';
// import dotenv from 'dotenv';
// dotenv.config();

// const agent = new AtpAgent({ service: 'https://bsky.social' });

// await agent.login({
//   identifier: process.env.BLUESKY_USERNAME,
//   password: process.env.BLUESKY_APP_PASSWORD
// });

// export const fetchBlueskyPosts = async (keyword) => {
//   const { data } = await agent.app.bsky.feed.searchPosts({ q: keyword, limit: 10 });
//   return data.posts.map(post => ({
//     uri: post.uri,
//     cid: post.cid,
//     text: post.record.text,
//     author: post.author.handle,
//     timestamp: post.record.createdAt
//   }));
// };

// export default  {fetchBlueskyPosts} 
// 
// // services/bluesky.js
import { AtpAgent } from '@atproto/api';
import dotenv from 'dotenv';

dotenv.config();

const agent = new AtpAgent({ service: 'https://bsky.social' });

await agent.login({
  identifier: process.env.BLUESKY_USERNAME,
  password: process.env.BLUESKY_APP_PASSWORD
});

const fetchBlueskyPosts = async (keyword) => {
  const { data } = await agent.app.bsky.feed.searchPosts({ q: keyword, limit: 10 });

  return data.posts.map(post => ({
    uri: post.uri,
    cid: post.cid,
    text: post.record.text,
    author: post.author.handle,
    timestamp: post.record.createdAt
  }));
};

export default fetchBlueskyPosts;
;
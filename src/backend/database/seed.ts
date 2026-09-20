/**
 * Development seed data (mirrors database/seeds/*.sql).
 * Realistic creators and content — no lorem ipsum, no "Test User".
 */
import type {
  BuzzNotification,
  Creator,
  LongVideo,
  NewsArticle,
  Post,
  ShortVideo,
  Story,
  TrendingTopic,
} from "../domain/types";

const V = (name: string) => `https://storage.googleapis.com/gtv-videos-bucket/sample/${name}.mp4`;

export const CURRENT_USER_ID = "u-alex";

export const creators: Creator[] = [
  {
    id: "u-alex",
    username: "you",
    displayName: "Alex Rivera",
    avatarKey: "avatar/alex-rivera",
    verified: true,
    bio: "Building things - Coffee & code - BUZZ early adopter",
    followers: 1300,
    following: 342,
    posts: 6,
  },
  {
    id: "u-maya",
    username: "maya.k",
    displayName: "Maya Kapoor",
    avatarKey: "avatar/maya-kapoor",
    verified: true,
    bio: "Natural light portraits. Mumbai to Lisbon.",
    followers: 84200,
    following: 412,
    posts: 318,
  },
  {
    id: "u-leo",
    username: "leo.wilder",
    displayName: "Leo Wilder",
    avatarKey: "avatar/leo-wilder",
    verified: false,
    bio: "Roads, ridges and long exposures.",
    followers: 22800,
    following: 190,
    posts: 204,
  },
  {
    id: "u-nina",
    username: "nina.co",
    displayName: "Nina Cortez",
    avatarKey: "avatar/nina-cortez",
    verified: true,
    bio: "Product designer. Interfaces that breathe.",
    followers: 51600,
    following: 288,
    posts: 142,
  },
  {
    id: "u-sam",
    username: "sam_films",
    displayName: "Sam Okafor",
    avatarKey: "avatar/sam-okafor",
    verified: false,
    bio: "Short films, mostly at night.",
    followers: 17400,
    following: 233,
    posts: 96,
  },
  {
    id: "u-riko",
    username: "riko",
    displayName: "Riko Tanaka",
    avatarKey: "avatar/riko-tanaka",
    verified: true,
    bio: "Neon Rain. Producer, Tokyo.",
    followers: 132000,
    following: 154,
    posts: 271,
  },
  {
    id: "u-june",
    username: "june.h",
    displayName: "June Hart",
    avatarKey: "avatar/june-hart",
    verified: false,
    bio: "Kitchen experiments in 60 seconds.",
    followers: 64300,
    following: 320,
    posts: 415,
  },
];

const now = Date.UTC(2026, 7, 27, 12, 0, 0);
const minutesAgo = (m: number) => new Date(now - m * 60_000).toISOString();

export const stories: Story[] = [
  ["u-maya", "story/maya-golden", 12, false],
  ["u-leo", "story/leo-ridge", 48, false],
  ["u-nina", "story/nina-studio", 96, true],
  ["u-sam", "story/sam-set", 140, false],
  ["u-riko", "story/riko-booth", 220, true],
  ["u-june", "story/june-market", 300, true],
].map(([authorId, key, mins, viewed]) => ({
  id: `st-${key as string}`,
  authorId: authorId as string,
  media: {
    kind: "image" as const,
    objectKey: key as string,
    width: 1080,
    height: 1920,
    blurColor: "oklch(0.7 0.05 295)",
    alt: "Story",
  },
  createdAt: minutesAgo(mins as number),
  viewed: viewed as boolean,
}));

export const trending: TrendingTopic[] = [
  { id: "t-buzz", label: "#buzz", kind: "hashtag", category: "Trending", postCount: 128000, velocity: 0.94, region: "global" },
  { id: "t-golden", label: "#goldenhour", kind: "hashtag", category: "Travel", postCount: 61400, velocity: 0.81, region: "global" },
  { id: "t-neon", label: "#neonrain", kind: "hashtag", category: "Music", postCount: 31700, velocity: 0.88, region: "global" },
  { id: "t-indie", label: "#indiefilm", kind: "hashtag", category: "Entertainment", postCount: 24900, velocity: 0.66, region: "global" },
  { id: "t-design", label: "#designdaily", kind: "hashtag", category: "Technology", postCount: 8800, velocity: 0.72, region: "global" },
  { id: "t-ondevice", label: "On-device AI", kind: "topic", category: "Technology", postCount: 48200, velocity: 0.91, region: "global" },
  { id: "t-creator", label: "Creator Economy", kind: "topic", category: "Business", postCount: 22400, velocity: 0.58, region: "global" },
  { id: "t-sundance", label: "Sundance 2026", kind: "event", category: "Entertainment", postCount: 18800, velocity: 0.63, region: "us" },
  { id: "t-overtime", label: "Overtime Thriller", kind: "event", category: "Sports", postCount: 12100, velocity: 0.97, region: "us" },
  { id: "t-lisbon", label: "Lisbon", kind: "location", category: "Travel", postCount: 9400, velocity: 0.44, region: "eu" },
];

interface SeedPost {
  id: string;
  authorId: string;
  caption: string;
  key: string;
  aspect: number;
  hashtags: string[];
  category: string;
  location?: string;
  minutes: number;
  metrics: [number, number, number, number, number];
}

const seedPosts: SeedPost[] = [
  {
    id: "p-1",
    authorId: "u-maya",
    caption: "Golden hour never disappoints. #photography",
    key: "photo/sand-hands",
    aspect: 1,
    hashtags: ["photography", "goldenhour"],
    category: "Travel",
    location: "Praia da Ursa, Portugal",
    minutes: 12,
    metrics: [2140, 87, 24, 310, 41200],
  },
  {
    id: "p-2",
    authorId: "u-nina",
    caption: "Sketching a new home screen. Purple looks good on everything.",
    key: "photo/green-rails",
    aspect: 0.9,
    hashtags: ["designdaily", "product"],
    category: "Technology",
    minutes: 60,
    metrics: [987, 64, 12, 143, 18800],
  },
  {
    id: "p-3",
    authorId: "u-sam",
    caption: "Behind the scenes on the short film. Wrapped day 3.",
    key: "photo/underwater",
    aspect: 0.85,
    hashtags: ["indiefilm", "bts"],
    category: "Entertainment",
    location: "Lagos, Nigeria",
    minutes: 1440,
    metrics: [812, 51, 9, 96, 12400],
  },
  {
    id: "p-4",
    authorId: "u-leo",
    caption: "Six hours of switchbacks for ninety seconds of light.",
    key: "photo/cliff-road",
    aspect: 0.75,
    hashtags: ["goldenhour", "travel"],
    category: "Travel",
    location: "Vestrahorn, Iceland",
    minutes: 220,
    metrics: [3410, 122, 58, 640, 72100],
  },
  {
    id: "p-5",
    authorId: "u-june",
    caption: "Market haul. Three ingredients, one pan, twelve minutes.",
    key: "photo/market-produce",
    aspect: 1,
    hashtags: ["food", "cooking"],
    category: "Food",
    minutes: 420,
    metrics: [1560, 210, 33, 401, 29800],
  },
  {
    id: "p-6",
    authorId: "u-riko",
    caption: "Studio rebuild finished. Everything routes through the desk now.",
    key: "photo/studio-desk",
    aspect: 1.2,
    hashtags: ["neonrain", "music"],
    category: "Music",
    location: "Shibuya, Tokyo",
    minutes: 90,
    metrics: [5210, 318, 140, 980, 118000],
  },
];

export const posts: Post[] = seedPosts.map((p) => ({
  id: p.id,
  authorId: p.authorId,
  source: "buzz",
  caption: p.caption,
  media: [
    {
      kind: "image",
      objectKey: p.key,
      width: 1200,
      height: Math.round(1200 / p.aspect),
      blurColor: "oklch(0.85 0.02 285)",
      alt: p.caption,
    },
  ],
  hashtags: p.hashtags,
  ...(p.location ? { location: p.location } : {}),
  category: p.category,
  metrics: {
    likes: p.metrics[0],
    comments: p.metrics[1],
    shares: p.metrics[2],
    saves: p.metrics[3],
    views: p.metrics[4],
  },
  createdAt: minutesAgo(p.minutes),
  visibility: "public",
  moderationStatus: "approved",
}));

/** Content mirrored in from external platforms through the integration layer. */
export const externalPosts: Post[] = [
  {
    id: "x-1",
    authorId: "u-nina",
    source: "x",
    sourceName: "X",
    externalUrl: "https://x.com/ninacortez/status/1",
    caption:
      "Shipped the new discovery grid today. Masonry with mixed aspect ratios reads far better than a uniform grid — the eye actually has somewhere to travel.",
    media: [
      {
        kind: "image",
        objectKey: "photo/grid-preview",
        width: 1200,
        height: 675,
        blurColor: "oklch(0.8 0.03 295)",
        alt: "Discovery grid preview",
      },
    ],
    hashtags: ["designdaily"],
    category: "Technology",
    metrics: { likes: 4120, comments: 231, shares: 512, saves: 380, views: 210000 },
    createdAt: minutesAgo(180),
    visibility: "public",
    moderationStatus: "approved",
  },
  {
    id: "x-2",
    authorId: "u-riko",
    source: "x",
    sourceName: "X",
    externalUrl: "https://x.com/riko/status/2",
    caption: "New track drops Friday. Small preview lives in Shorts.",
    media: [],
    hashtags: ["neonrain"],
    category: "Music",
    metrics: { likes: 9800, comments: 604, shares: 1200, saves: 740, views: 480000 },
    createdAt: minutesAgo(320),
    visibility: "public",
    moderationStatus: "approved",
  },
];

export const news: NewsArticle[] = [
  {
    id: "n-1",
    title: "The quiet rise of small-team social apps in 2026",
    summary:
      "Lean teams are shipping discovery products that once needed hundreds of engineers, and audiences are following them.",
    sourceName: "The Verge",
    category: "Technology",
    url: "https://example.com/small-team-social",
    imageKey: "news/rain-window",
    publishedAt: minutesAgo(120),
    live: true,
  },
  {
    id: "n-2",
    title: "On-device models are changing how feeds get ranked",
    summary: "Ranking is moving closer to the handset, cutting latency and server cost.",
    sourceName: "Wired",
    category: "Technology",
    url: "https://example.com/on-device-ranking",
    imageKey: "news/chip-macro",
    publishedAt: minutesAgo(240),
    live: false,
  },
  {
    id: "n-3",
    title: "Overtime thriller sends the series to a decider",
    summary: "Two lead changes in the final ninety seconds set up a game seven.",
    sourceName: "Athletic Wire",
    category: "Sports",
    url: "https://example.com/overtime",
    imageKey: "news/arena-night",
    publishedAt: minutesAgo(65),
    live: true,
  },
  {
    id: "n-4",
    title: "Lisbon's night trains are booked solid through September",
    summary: "Slow travel demand keeps climbing across southern Europe.",
    sourceName: "Continental",
    category: "Travel",
    url: "https://example.com/night-trains",
    imageKey: "news/night-train",
    publishedAt: minutesAgo(400),
    live: false,
  },
  {
    id: "n-5",
    title: "Restaurant groups bet on 12-seat rooms",
    summary: "Smaller dining rooms are outperforming flagship venues on margin.",
    sourceName: "Service Weekly",
    category: "Lifestyle",
    url: "https://example.com/small-rooms",
    imageKey: "news/dining-room",
    publishedAt: minutesAgo(520),
    live: false,
  },
  {
    id: "n-6",
    title: "Creator payouts shift toward saves, not views",
    summary: "Platforms are rewarding intent signals over raw impressions.",
    sourceName: "Business Daily",
    category: "Business",
    url: "https://example.com/creator-payouts",
    imageKey: "news/studio-lights",
    publishedAt: minutesAgo(700),
    live: false,
  },
];

const shortSeed: Array<[string, string, string, string, string, string, number]> = [
  ["s-1", "u-riko", "New beat. Loop it.", "Riko — Neon Rain", "Music", V("ForBiggerBlazes"), 21400],
  ["s-2", "u-june", "60-second pasta. Actually works.", "Kitchen loop 12", "Food", V("ForBiggerFun"), 18200],
  ["s-3", "u-leo", "Ring road, hour nineteen.", "Ambient drive", "Travel", V("ForBiggerJoyrides"), 15600],
  ["s-4", "u-nina", "Prototyping the create sheet.", "Studio hum", "Tech", V("ForBiggerEscapes"), 9800],
  ["s-5", "u-maya", "One light, one reflector.", "Soft keys", "For You", V("ForBiggerMeltdowns"), 12300],
];

export const shorts: ShortVideo[] = shortSeed.map(
  ([id, authorId, caption, soundtrack, category, url, likes]) => ({
    id,
    authorId,
    caption,
    soundtrack,
    category,
    video: {
      kind: "video",
      objectKey: url,
      posterKey: `short/${id}`,
      durationSeconds: 24,
      width: 1080,
      height: 1920,
      alt: caption,
    },
    metrics: { likes, comments: 812, shares: 340, saves: 260, views: likes * 12 },
  }),
);

const videoSeed: Array<[string, string, string, string, string, number, string, number?]> = [
  ["v-1", "u-riko", "Making Neon Rain — full studio walkthrough", "Music", V("ForBiggerBlazes"), 212000, "1 week ago", 620],
  ["v-2", "u-leo", "Iceland ring road in 8 minutes", "Travel", V("ForBiggerJoyrides"), 1200000, "3 weeks ago", 180],
  ["v-3", "u-june", "The only knife skills tutorial you need", "Food", V("ForBiggerFun"), 540000, "1 month ago"],
  ["v-4", "u-nina", "Design system tour — building BUZZ", "Tech", V("ForBiggerEscapes"), 38000, "4 days ago"],
  ["v-5", "u-maya", "Portrait lighting on a budget", "For You", V("ForBiggerMeltdowns"), 96000, "5 days ago"],
];

export const videos: LongVideo[] = videoSeed.map(
  ([id, authorId, title, category, url, views, publishedAt, progress]) => ({
    id,
    authorId,
    title,
    category,
    video: {
      kind: "video",
      objectKey: url,
      posterKey: `video/${id}`,
      durationSeconds: 1330,
      width: 1920,
      height: 1080,
      alt: title,
    },
    views,
    publishedAt,
    ...(progress ? { progressSeconds: progress } : {}),
  }),
);

/** Explore grid: mixed aspect ratios so the masonry has visual rhythm. */
export const explorePhotos = [
  { id: "e-1", key: "photo/cliff-road", aspect: 0.72, authorId: "u-leo", category: "Travel" },
  { id: "e-2", key: "photo/mushroom-light", aspect: 1.05, authorId: "u-maya", category: "Trending" },
  { id: "e-3", key: "photo/underwater", aspect: 0.86, authorId: "u-sam", category: "Trending" },
  { id: "e-4", key: "photo/blue-room", aspect: 1.35, authorId: "u-nina", category: "Technology" },
  { id: "e-5", key: "photo/paint-water", aspect: 1.2, authorId: "u-nina", category: "Latest" },
  { id: "e-6", key: "photo/ocean-sun", aspect: 0.78, authorId: "u-leo", category: "Travel" },
  { id: "e-7", key: "photo/dining-room", aspect: 1.3, authorId: "u-june", category: "Food" },
  { id: "e-8", key: "photo/desert-dunes", aspect: 1.25, authorId: "u-maya", category: "Travel" },
  { id: "e-9", key: "photo/bridge-cables", aspect: 0.8, authorId: "u-leo", category: "Latest" },
  { id: "e-10", key: "photo/studio-desk", aspect: 1.1, authorId: "u-riko", category: "Technology" },
  { id: "e-11", key: "photo/green-rails", aspect: 0.82, authorId: "u-nina", category: "Trending" },
  { id: "e-12", key: "photo/stadium-lights", aspect: 1.4, authorId: "u-sam", category: "Sports" },
  { id: "e-13", key: "photo/market-produce", aspect: 0.95, authorId: "u-june", category: "Food" },
  { id: "e-14", key: "photo/sand-hands", aspect: 1, authorId: "u-maya", category: "Latest" },
  { id: "e-15", key: "photo/night-train", aspect: 0.7, authorId: "u-leo", category: "Travel" },
  { id: "e-16", key: "photo/arena-crowd", aspect: 1.5, authorId: "u-sam", category: "Sports" },
];

export const notifications: BuzzNotification[] = [
  { id: "nt-1", kind: "like", actorId: "u-maya", body: "liked your post \"Late shift edits\"", createdAt: minutesAgo(8), read: false },
  { id: "nt-2", kind: "follow", actorId: "u-riko", body: "started following you", createdAt: minutesAgo(52), read: false },
  { id: "nt-3", kind: "comment", actorId: "u-nina", body: "commented: this grid spacing is right", createdAt: minutesAgo(140), read: true },
  { id: "nt-4", kind: "trending", actorId: "u-leo", body: "#goldenhour is trending in Travel", createdAt: minutesAgo(300), read: true },
];

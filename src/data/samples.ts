export type SampleGroup = 'official' | 'original';
export interface Sample { id: string; label: string; hint: string; story: string; src: string; group: SampleGroup; orientation?: 'landscape' | 'portrait'; }
export interface StudioMode { id: string; label: string; tagline: string; prompt: string; tools: string; }

export const MODES: StudioMode[] = [
  { id: 'wanted', label: 'Wanted file', tagline: 'Turn your crew into Leonida folklore', prompt: 'Build a high-contrast wanted poster with bold type and neon accents', tools: 'Filter · Text · Stickers' },
  { id: 'ride', label: 'Ride wrap', tagline: 'Give your getaway car a signature look', prompt: 'Add a loud custom wrap, racing stickers, and neon underglow', tools: 'Draw · Shapes · Stickers' },
  { id: 'vice', label: 'Vice cover', tagline: 'Make a postcard from the darkest side of paradise', prompt: 'Add a Vice City sunset grade, palm silhouettes, and cover-art text', tools: 'Filter · Text · Frame' },
  { id: 'nightlife', label: 'Nightlife flyer', tagline: 'Put your night on the city wall', prompt: 'Make a loud event flyer with type, shapes, and a flash-lit finish', tools: 'Text · Shapes · Filter' },
  { id: 'crew-card', label: 'Crew card', tagline: 'Give your people a calling card', prompt: 'Build a clean crew identity with a title, frame, and signature color', tools: 'Text · Frame · Draw' },
  { id: 'postcard', label: 'Road postcard', tagline: 'Send proof from the edge of Leonida', prompt: 'Turn the scene into a sun-faded postcard with a personal note', tools: 'Crop · Text · Sticker' },
  { id: 'sunset-cover', label: 'Sunset cover', tagline: 'Make every horizon feel expensive', prompt: 'Build a warm coastal cover with saturated color, clean type, and a long shadow', tools: 'Filter · Text · Frame' },
  { id: 'night-drive', label: 'Night drive', tagline: 'Bring chrome and rain to the road', prompt: 'Push the scene into a midnight drive with electric reflections and sharp contrast', tools: 'Filter · Draw · Text' },
  { id: 'miami-noir', label: 'Miami noir', tagline: 'Let paradise keep its secrets', prompt: 'Create a dark crime still with deep shadows, restrained color, and case-file type', tools: 'Filter · Text · Frame' },
  { id: 'poolside', label: 'Poolside issue', tagline: 'Give summer an editorial edge', prompt: 'Turn the scene into a bright poolside editorial with warm grain and oversized type', tools: 'Filter · Text · Stickers' },
  { id: 'flash-report', label: 'Flash report', tagline: 'Make scene front-page news', prompt: 'Build a breaking-news visual with bold headlines, hard lines, and urgent color', tools: 'Text · Shapes · Draw' },
  { id: 'coastline', label: 'Coastline', tagline: 'Send a clean signal from shore', prompt: 'Make a minimal coastal travel piece with open space, soft color, and small type', tools: 'Crop · Text · Filter' },
];

export const SAMPLES: Sample[] = [
  { id: 'story-jason', label: 'Jason / Story', hint: 'GTA VI 9:16 crop', story: 'A vertical frame for the next move.', src: '/samples/gta6-story-jason.jpg', group: 'official', orientation: 'portrait' },
  { id: 'story-lucia', label: 'Lucia / Story', hint: 'GTA VI 9:16 crop', story: 'A vertical frame for the next move.', src: '/samples/gta6-story-lucia.jpg', group: 'official', orientation: 'portrait' },
  { id: 'story-pair', label: 'Jason + Lucia / Story', hint: 'GTA VI 9:16 crop', story: 'Two names. One way out.', src: '/samples/gta6-story-pair.jpg', group: 'official', orientation: 'portrait' },
  { id: 'story-vice-city', label: 'Vice City / Story', hint: 'GTA VI 9:16 crop', story: 'The city looks better when it fills the screen.', src: '/samples/gta6-story-vice-city.jpg', group: 'official', orientation: 'portrait' },
  { id: 'jason-lucia', label: 'Jason & Lucia', hint: 'Official album artwork', story: 'Jason and Lucia are starting over in Vice City. Give their next move your look.', src: '/samples/jason-lucia.jpg', group: 'official' },
  { id: 'gta-vi-logo', label: 'GTA VI Logo Art', hint: 'Official artwork with logo', story: 'A postcard from Leonida: sun, chrome, and trouble waiting past the causeway.', src: '/samples/gta-vi-logo.jpg', group: 'official' },
  { id: 'vice-motel', label: 'Vice Motel', hint: 'Original Leonida artwork', story: 'Check in late. Leave before sunrise.', src: '/samples/vice-motel.png', group: 'original' },
  { id: 'vice-sunset', label: 'Sunset Stop', hint: 'Original Leonida artwork', story: 'Every road out of Vice City has a story.', src: '/samples/vice-sunset.png', group: 'original' },
  { id: 'neon-coastline', label: 'Neon Coastline', hint: 'Original night-drive artwork', story: 'Moonlight, motel neon, and an empty road home.', src: '/samples/neon-coastline.png', group: 'original', orientation: 'landscape' },
  { id: 'sunset-scooter', label: 'Sunset Scooter', hint: 'Original 9:16 artwork', story: 'Last light on the boardwalk.', src: '/samples/sunset-scooter.png', group: 'original', orientation: 'portrait' },
  { id: 'leonida-speedboat', label: 'Night Runner', hint: 'Original Leonida artwork', story: 'The fastest way across town is sometimes across water.', src: '/samples/leonida-speedboat.png', group: 'original' },
  { id: 'leonida-lounge', label: 'Roadside Lounge', hint: 'Original Leonida artwork', story: 'A little neon, a little trouble, nothing unusual.', src: '/samples/leonida-lounge.png', group: 'original' },
  { id: 'official-jason', label: 'Jason Duval', hint: 'Official Rockstar media', story: 'Jason knows how he wants this to turn out.', src: '/samples/official-jason.jpg', group: 'official' },
  { id: 'official-lucia', label: 'Lucia Caminos', hint: 'Official Rockstar media', story: 'Lucia is done waiting for the good life.', src: '/samples/official-lucia.jpg', group: 'official' },
  { id: 'official-vice-city', label: 'Vice City', hint: 'Official Rockstar media', story: 'The darkest side of the sunniest place in America.', src: '/samples/official-vice-city.jpg', group: 'official' },
  { id: 'official-album', label: 'Album Cover Art', hint: 'Official Rockstar media', story: 'Soundtrack energy for your next move.', src: '/samples/official-album.jpg', group: 'official' },
  { id: 'official-cover', label: 'Official Cover Art', hint: 'Official Rockstar media', story: 'The story starts under a bright sky.', src: '/samples/official-cover.jpg', group: 'official' },
  { id: 'official-postcard', label: 'Vice City Postcard', hint: 'Official Rockstar media', story: 'Wish you were here. Maybe you are.', src: '/samples/official-postcard.jpg', group: 'official' },
];

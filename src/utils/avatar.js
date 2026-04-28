const PALETTE = [
  "from-rose-400 to-rose-600",
  "from-amber-400 to-orange-600",
  "from-emerald-400 to-teal-600",
  "from-sky-400 to-blue-600",
  "from-violet-400 to-purple-600",
  "from-fuchsia-400 to-pink-600",
  "from-lime-400 to-green-600",
  "from-cyan-400 to-sky-600",
];

export const MIHAI_AVATAR_URL =
  "https://api.dicebear.com/7.x/bottts-neutral/svg?seed=mihAI&backgroundColor=22b8ad,0ea5a6&radius=50";

const USERNAME_AVATAR_OVERRIDES = {
  alex_florea: "https://randomuser.me/api/portraits/men/22.jpg",
  raul_ardelean: "https://randomuser.me/api/portraits/men/14.jpg",
  maria_elisabeta: "https://randomuser.me/api/portraits/women/53.jpg",
  daniel_bischin: "https://randomuser.me/api/portraits/men/77.jpg",
};

const STOCK_PORTRAITS = [
  "https://randomuser.me/api/portraits/women/12.jpg",
  "https://randomuser.me/api/portraits/men/32.jpg",
  "https://randomuser.me/api/portraits/women/44.jpg",
  "https://randomuser.me/api/portraits/men/56.jpg",
  "https://randomuser.me/api/portraits/women/68.jpg",
  "https://randomuser.me/api/portraits/men/75.jpg",
  "https://randomuser.me/api/portraits/women/22.jpg",
  "https://randomuser.me/api/portraits/men/41.jpg",
  "https://randomuser.me/api/portraits/women/53.jpg",
  "https://randomuser.me/api/portraits/men/85.jpg",
  "https://randomuser.me/api/portraits/women/90.jpg",
  "https://randomuser.me/api/portraits/men/14.jpg",
];

export function getInitials(name) {
  if (!name) return "?";
  return String(name)
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function hashString(value) {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

export function getAvatarColor(seed) {
  if (!seed) return PALETTE[0];
  return PALETTE[hashString(String(seed)) % PALETTE.length];
}

export function getUserAvatarUrl(user) {
  if (!user) return null;

  const usernameKey = String(user.username || "").trim().toLowerCase();
  if (usernameKey && USERNAME_AVATAR_OVERRIDES[usernameKey]) {
    return USERNAME_AVATAR_OVERRIDES[usernameKey];
  }

  if (user.avatar_url) return user.avatar_url;
  if (user.avatar) return user.avatar;

  const seed = user.username || user.name || user.id || "user";
  return STOCK_PORTRAITS[hashString(String(seed)) % STOCK_PORTRAITS.length];
}

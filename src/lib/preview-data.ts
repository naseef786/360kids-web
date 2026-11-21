// Fictional, in-memory UI examples. Never use these as backend responses.
export const previewActivities = [
  { id: "art-lab", title: "Little Makers Art Lab", provider: "Paper Lantern Studio", area: "Al Barsha", category: "Arts", ages: "4–8", priceFils: 9500, image: "creativity", description: "Paint, print and bring a new creation home." },
  { id: "mini-football", title: "Mini Football Club", provider: "Sunrise Sports", area: "Jumeirah", category: "Sports", ages: "5–10", priceFils: 12000, image: "movement", description: "Team games and first skills in a friendly group." },
  { id: "story-play", title: "Story & Play Morning", provider: "Willow Playhouse", area: "Dubai Marina", category: "Indoor play", ages: "2–5", priceFils: 8000, image: "discovery", description: "Stories, sensory corners and time to explore." },
  { id: "science-club", title: "Curious Science Club", provider: "Bright Sparks", area: "Mirdif", category: "Learning", ages: "7–12", priceFils: 14000, image: "discovery", description: "Hands-on experiments for curious minds." },
  { id: "music-movement", title: "Music & Movement", provider: "Little Rhythm Room", area: "Business Bay", category: "Music", ages: "3–6", priceFils: 9000, image: "creativity", description: "Sing, move and discover rhythm together." },
  { id: "nature-explorers", title: "Nature Explorers", provider: "Green Steps", area: "Al Safa", category: "Outdoors", ages: "6–11", priceFils: 11000, image: "movement", description: "Outdoor games and discoveries with a guide." },
] as const;

export const previewBookings = [
  { reference: "DEMO-101", activity: "Little Makers Art Lab", status: "Request sent", place: "No place yet", action: "Wait for the provider to respond", deadline: "Response due within 24 hours" },
  { reference: "DEMO-102", activity: "Mini Football Club", status: "Offer ready", place: "Places are held for this offer", action: "Review the offer and respond", deadline: "Offer expires at the shown deadline" },
  { reference: "DEMO-103", activity: "Story & Play Morning", status: "Payment due", place: "Places are held, not confirmed", action: "Follow the verified payment instructions", deadline: "Pay before the shown deadline" },
  { reference: "DEMO-104", activity: "Curious Science Club", status: "Payment under review", place: "Not confirmed", action: "Wait for finance verification", deadline: "Review ends at the shown deadline" },
  { reference: "DEMO-105", activity: "Music & Movement", status: "Confirmed", place: "Your place is confirmed", action: "No action needed", deadline: "No action needed" },
] as const;

export const previewProviderQueue = [
  { reference: "DEMO-201", activity: "Mini Football Club", state: "New request", action: "Check external availability before responding" },
  { reference: "DEMO-202", activity: "Little Makers Art Lab", state: "Offer awaiting family", action: "Monitor the fixed response deadline" },
  { reference: "DEMO-203", activity: "Nature Explorers", state: "Confirmed", action: "Prepare the authorized roster" },
] as const;

export const previewAdminQueue = [
  { reference: "DEMO-301", subject: "Provider application", state: "Needs review" },
  { reference: "DEMO-302", subject: "Activity listing", state: "Draft awaiting publication review" },
  { reference: "DEMO-303", subject: "Payment exception", state: "Finance review required" },
] as const;

/**
 * ATOMZ — Proof & Testimonials Data
 * =============================================================================
 * TRUTH & SAFETY RULES (Section 1):
 * - Do not invent testimonials, client names, quotes, numbers, ratings, results,
 *   case studies, or logos.
 * - Anything not supplied gets a clearly marked placeholder.
 * - Unsupplied items render as an obvious "Coming Soon" state.
 * =============================================================================
 */

window.ATOMZ_PROOF_DATA = {
  // Block 1: Client Messages
  // Each item: { quote, author, businessType, location, isPlaceholder }
  clientMessages: [
    {
      id: "quote-1",
      quote: "[Client quote: to add]",
      author: "[First name: to add]",
      businessType: "Local Business Owner",
      location: "[Location: to add]",
      isPlaceholder: true
    },
    {
      id: "quote-2",
      quote: "[Client quote: to add]",
      author: "[First name: to add]",
      businessType: "Café / Clinic / Salon Owner",
      location: "[Location: to add]",
      isPlaceholder: true
    },
    {
      id: "quote-3",
      quote: "[Client quote: to add]",
      author: "[First name: to add]",
      businessType: "Retail / Brand Founder",
      location: "[Location: to add]",
      isPlaceholder: true
    }
  ],

  // Block 2: What We Have Built
  // Each item: { title, description, status: "Demo"|"In use", image, isPlaceholder }
  builtProducts: [
    {
      id: "product-1",
      title: "Café Digital Ordering System",
      description: "Direct table-side mobile ordering and automated kitchen bill generation.",
      status: "Demo",
      image: "assets/images/placeholder-order-system.png",
      tag: "Hospitality Tool",
      isPlaceholder: false
    },
    {
      id: "product-2",
      title: "Local Footfall Tracker & QR Flow",
      description: "Physical tap-card reception, automated WhatsApp booking, and visit attribution.",
      status: "Demo",
      image: "assets/images/placeholder-footfall.png",
      tag: "Campaign System",
      isPlaceholder: false
    },
    {
      id: "product-3",
      title: "Custom Lead & Inquiry Dispatcher",
      description: "Structured routing for high-intent customer inquiries straight to team WhatsApp.",
      status: "Demo",
      image: "assets/images/placeholder-lead-tool.png",
      tag: "Workflow Automation",
      isPlaceholder: false
    }
  ],

  // Block 3: Example Reels (Vertical video embeds / thumbnails)
  // Each item: { title, caption, videoUrl, posterUrl, isPlaceholder }
  exampleReels: [
    {
      id: "reel-1",
      title: "Local Business Reel Sample 01",
      caption: "Hook, pacing, and visual storytelling tailored to local audience engagement.",
      videoUrl: "",
      posterUrl: "assets/images/placeholder-reel-1.png",
      isPlaceholder: true
    },
    {
      id: "reel-2",
      title: "Local Business Reel Sample 02",
      caption: "Physical walkthrough and service demonstration designed to drive foot traffic.",
      videoUrl: "",
      posterUrl: "assets/images/placeholder-reel-2.png",
      isPlaceholder: true
    },
    {
      id: "reel-3",
      title: "Local Business Reel Sample 03",
      caption: "Direct product showcase and customer action prompt.",
      videoUrl: "",
      posterUrl: "assets/images/placeholder-reel-3.png",
      isPlaceholder: true
    }
  ]
};

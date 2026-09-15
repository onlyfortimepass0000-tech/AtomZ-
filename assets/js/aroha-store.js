/**
 * AROHA / KROHA Shared State Engine
 * Reactive campaign lifecycle and creator-brand collaboration store.
 */
(function (global) {
  "use strict";

  const STORAGE_KEY_CAMPAIGNS = "aroha_campaigns_v1";
  const STORAGE_KEY_CREATORS = "aroha_creators_v1";
  const STORAGE_KEY_BRANDS = "aroha_brands_v1";

  // The 9 canonical campaign stages
  const STAGES = [
    "Interested",
    "Invited",
    "Accepted",
    "Content Due",
    "Submitted",
    "Revision Required",
    "Approved",
    "Published",
    "Paid"
  ];

  // Seed Data: Creators
  const DEFAULT_CREATORS = [
    {
      id: "cr_1",
      handle: "@rahuljawatwala",
      name: "Rahul Jawatwala",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=280&q=80",
      niche: "Men's Fitness & Lifestyle",
      location: "Mumbai, India",
      bio: "High-intensity athletic training, functional hypertrophy & clean nutrition. Building aesthetic conditioning with science.",
      followers: 185000,
      avgViews: 245000,
      reach: 420000,
      engagementRate: 4.8,
      likesAvg: 16800,
      commentsAvg: 740,
      savesAvg: 3800,
      sharesAvg: 1950,
      pricing: {
        reel: 35000,
        carousel: 22000,
        story: 9000,
        bundle: 55000
      },
      demographics: {
        topLocations: ["Mumbai (42%)", "Delhi NCR (24%)", "Bengaluru (18%)", "Pune (8%)"],
        gender: { male: 78, female: 22 },
        ageGroups: { "18-24": 45, "25-34": 42, "35+": 13 }
      },
      socialLinks: {
        instagram: "https://instagram.com/rahuljawatwala",
        youtube: "https://youtube.com/@rahuljawatwala"
      },
      pastCampaignsCount: 14,
      verified: true
    },
    {
      id: "cr_2",
      handle: "@fitharsh__15",
      name: "Harsh Sharma",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=280&q=80",
      niche: "Calisthenics & Powerbuilding",
      location: "Delhi, India",
      bio: "Bodyweight mastery, strength feats, and high-energy motivational reels for young athletes.",
      followers: 94000,
      avgViews: 128000,
      reach: 260000,
      engagementRate: 5.4,
      likesAvg: 11200,
      commentsAvg: 480,
      savesAvg: 2900,
      sharesAvg: 1400,
      pricing: {
        reel: 25000,
        carousel: 16000,
        story: 6500,
        bundle: 40000
      },
      demographics: {
        topLocations: ["Delhi (38%)", "Jaipur (21%)", "Chandigarh (16%)", "Indore (12%)"],
        gender: { male: 84, female: 16 },
        ageGroups: { "18-24": 62, "25-34": 31, "35+": 7 }
      },
      socialLinks: {
        instagram: "https://instagram.com/fitharsh__15"
      },
      pastCampaignsCount: 9,
      verified: true
    },
    {
      id: "cr_3",
      handle: "@aum.creation",
      name: "Aum Patel",
      avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=280&q=80",
      niche: "Cinematic Tech & Aesthetics",
      location: "Bengaluru, India",
      bio: "Crisp product cinematography, desk setups, Apple ecosystem workflows, and creative tech storytelling.",
      followers: 142000,
      avgViews: 310000,
      reach: 510000,
      engagementRate: 6.2,
      likesAvg: 22400,
      commentsAvg: 920,
      savesAvg: 6400,
      sharesAvg: 3100,
      pricing: {
        reel: 42000,
        carousel: 28000,
        story: 11000,
        bundle: 68000
      },
      demographics: {
        topLocations: ["Bengaluru (35%)", "Mumbai (28%)", "Hyderabad (19%)", "US/UK (12%)"],
        gender: { male: 66, female: 34 },
        ageGroups: { "18-24": 38, "25-34": 51, "35+": 11 }
      },
      socialLinks: {
        instagram: "https://instagram.com/aum.creation"
      },
      pastCampaignsCount: 22,
      verified: true
    }
  ];

  // Seed Data: Brand Profiles
  const DEFAULT_BRANDS = [
    {
      id: "br_1",
      name: "Novu Athletic",
      industry: "Performance Apparel & Gear",
      logo: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=120&q=80",
      contactPerson: "Aryan T. (Growth Lead)",
      location: "Bengaluru, India",
      budgetTotal: 350000,
      budgetSpent: 185000
    },
    {
      id: "br_2",
      name: "Aura Nutrition",
      industry: "Clean Supplements & Hydration",
      logo: "https://images.unsplash.com/photo-1550572017-edd951aa8f72?auto=format&fit=crop&w=120&q=80",
      contactPerson: "Priya V. (Brand Director)",
      location: "Mumbai, India",
      budgetTotal: 500000,
      budgetSpent: 220000
    }
  ];

  // Seed Data: Campaigns
  const DEFAULT_CAMPAIGNS = [
    {
      id: "camp_101",
      brandId: "br_1",
      brandName: "Novu Athletic",
      brandLogo: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=120&q=80",
      title: "Novu Pro Compression 2.0 Launch",
      niche: "Fitness & Training",
      goal: "Brand awareness & D2C conversions through workout-tested creator reels",
      status: "Submitted", // Stage: Creator uploaded draft, waiting for brand review
      creatorId: "cr_1",
      creatorName: "Rahul Jawatwala",
      creatorHandle: "@rahuljawatwala",
      creatorAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=280&q=80",
      budget: 35000,
      deadline: "2026-09-22",
      deliverables: [
        { type: "Instagram Reel", count: 1, requirement: "45-60s dynamic high-intensity training showcase with hook in first 3s" },
        { type: "Instagram Story Set", count: 2, requirement: "Link swipe-up with discount code ATOMZ15" }
      ],
      usageRights: "90 days organic reposting + Meta Ads whitelisting",
      dosAndDonts: {
        dos: ["Show the sweat-wicking compression in natural sunlight", "Mention the 4-way stretch during heavy squats", "Include clear CTA to bio link"],
        donts: ["Do not film in overly dark gym lighting", "No competing logo visible"]
      },
      draftUrl: "https://drive.google.com/file/d/1A2b3C4d5E_NovuPro_Draft_v1/view",
      draftNotes: "Hook has been tested for high retention. Color graded for clean athletic tones.",
      revisions: [
        {
          requestedAt: "2026-09-12T14:30:00Z",
          note: "Great energy! Can we zoom in on the compression waist seam around 0:14?",
          resolved: true
        }
      ],
      publishedUrl: "",
      metrics: {
        views: 0,
        likes: 0,
        comments: 0,
        saves: 0,
        shares: 0
      },
      timeline: [
        { stage: "Interested", at: "2026-09-08T10:00:00Z" },
        { stage: "Invited", at: "2026-09-08T11:30:00Z" },
        { stage: "Accepted", at: "2026-09-09T09:15:00Z" },
        { stage: "Content Due", at: "2026-09-15T18:00:00Z" },
        { stage: "Submitted", at: "2026-09-14T16:20:00Z" }
      ]
    },
    {
      id: "camp_102",
      brandId: "br_1",
      brandName: "Novu Athletic",
      brandLogo: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=120&q=80",
      title: "Core Heavyweight Gym Hoodie Campaign",
      niche: "Calisthenics & Gymwear",
      goal: "Generate organic viral reach showcasing heavyweight oversized fit in street workouts",
      status: "Invited", // Stage: Invited, waiting for creator accept
      creatorId: "cr_2",
      creatorName: "Harsh Sharma",
      creatorHandle: "@fitharsh__15",
      creatorAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=280&q=80",
      budget: 25000,
      deadline: "2026-09-28",
      deliverables: [
        { type: "Instagram Reel", count: 1, requirement: "Calisthenics outdoor bar routine wearing the black oversized hoodie" }
      ],
      usageRights: "60 days organic usage on Novu official channels",
      dosAndDonts: {
        dos: ["Show muscle-ups & front levers wearing the hoodie", "Call out the 480 GSM French Terry fabric"],
        donts: ["No indoor commercial gym background"]
      },
      draftUrl: "",
      draftNotes: "",
      revisions: [],
      publishedUrl: "",
      metrics: { views: 0, likes: 0, comments: 0, saves: 0, shares: 0 },
      timeline: [
        { stage: "Interested", at: "2026-09-13T08:00:00Z" },
        { stage: "Invited", at: "2026-09-14T12:00:00Z" }
      ]
    },
    {
      id: "camp_103",
      brandId: "br_2",
      brandName: "Aura Nutrition",
      brandLogo: "https://images.unsplash.com/photo-1550572017-edd951aa8f72?auto=format&fit=crop&w=120&q=80",
      title: "Pure Electrolyte Hydration Stick Packs",
      niche: "Health & Nutrition",
      goal: "Highlight sugar-free hydration science during marathon and hybrid training workouts",
      status: "Approved", // Stage: Draft approved, waiting for creator to publish
      creatorId: "cr_1",
      creatorName: "Rahul Jawatwala",
      creatorHandle: "@rahuljawatwala",
      creatorAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=280&q=80",
      budget: 35000,
      deadline: "2026-09-18",
      deliverables: [
        { type: "Instagram Reel", count: 1, requirement: "30s high-cadence reel on morning hydration routine" }
      ],
      usageRights: "Perpetual digital rights",
      dosAndDonts: {
        dos: ["Dissolve stick pack into clear water bottle", "Show ingredients label"],
        donts: ["Do not make unsubstantiated medical claims"]
      },
      draftUrl: "https://frame.io/preview/aura-hydration-v2-final",
      draftNotes: "Approved by brand team on 14 Sept.",
      revisions: [],
      publishedUrl: "",
      metrics: { views: 0, likes: 0, comments: 0, saves: 0, shares: 0 },
      timeline: [
        { stage: "Interested", at: "2026-09-01T10:00:00Z" },
        { stage: "Invited", at: "2026-09-02T11:00:00Z" },
        { stage: "Accepted", at: "2026-09-03T09:00:00Z" },
        { stage: "Content Due", at: "2026-09-10T18:00:00Z" },
        { stage: "Submitted", at: "2026-09-11T14:00:00Z" },
        { stage: "Approved", at: "2026-09-14T10:00:00Z" }
      ]
    },
    {
      id: "camp_104",
      brandId: "br_1",
      brandName: "Novu Athletic",
      brandLogo: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=120&q=80",
      title: "Summer Performance Seamless Tee",
      niche: "Fitness & Lifestyle",
      goal: "Product launch campaign resulting in 320K+ organic impressions",
      status: "Paid", // Stage: Completed & Paid
      creatorId: "cr_1",
      creatorName: "Rahul Jawatwala",
      creatorHandle: "@rahuljawatwala",
      creatorAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=280&q=80",
      budget: 35000,
      deadline: "2026-08-25",
      deliverables: [
        { type: "Instagram Reel", count: 1, requirement: "Seamless tee durability test" }
      ],
      usageRights: "Full rights",
      dosAndDonts: { dos: ["Dynamic lighting"], donts: ["No filter distortion"] },
      draftUrl: "https://drive.google.com/file/d/past_novu_reel/view",
      draftNotes: "Completed on schedule.",
      revisions: [],
      publishedUrl: "https://instagram.com/reel/C8qWxyZ_novu_live",
      metrics: {
        views: 284000,
        likes: 19200,
        comments: 860,
        saves: 4200,
        shares: 2100
      },
      timeline: [
        { stage: "Interested", at: "2026-08-10T10:00:00Z" },
        { stage: "Invited", at: "2026-08-11T10:00:00Z" },
        { stage: "Accepted", at: "2026-08-12T10:00:00Z" },
        { stage: "Content Due", at: "2026-08-18T10:00:00Z" },
        { stage: "Submitted", at: "2026-08-19T10:00:00Z" },
        { stage: "Approved", at: "2026-08-20T10:00:00Z" },
        { stage: "Published", at: "2026-08-22T10:00:00Z" },
        { stage: "Paid", at: "2026-08-26T10:00:00Z" }
      ]
    }
  ];

  // Helper Store API
  const ArohaStore = {
    STAGES,

    // Initialize or restore store
    init() {
      if (!localStorage.getItem(STORAGE_KEY_CREATORS)) {
        localStorage.setItem(STORAGE_KEY_CREATORS, JSON.stringify(DEFAULT_CREATORS));
      }
      if (!localStorage.getItem(STORAGE_KEY_BRANDS)) {
        localStorage.setItem(STORAGE_KEY_BRANDS, JSON.stringify(DEFAULT_BRANDS));
      }
      if (!localStorage.getItem(STORAGE_KEY_CAMPAIGNS)) {
        localStorage.setItem(STORAGE_KEY_CAMPAIGNS, JSON.stringify(DEFAULT_CAMPAIGNS));
      }
    },

    resetToDefaults() {
      localStorage.setItem(STORAGE_KEY_CREATORS, JSON.stringify(DEFAULT_CREATORS));
      localStorage.setItem(STORAGE_KEY_BRANDS, JSON.stringify(DEFAULT_BRANDS));
      localStorage.setItem(STORAGE_KEY_CAMPAIGNS, JSON.stringify(DEFAULT_CAMPAIGNS));
      this.dispatchChange();
    },

    // Creators
    getCreators() {
      this.init();
      try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY_CREATORS)) || DEFAULT_CREATORS;
      } catch (e) {
        return DEFAULT_CREATORS;
      }
    },

    getCreator(id) {
      return this.getCreators().find(c => c.id === id || c.handle === id) || this.getCreators()[0];
    },

    updateCreator(id, data) {
      const creators = this.getCreators().map(c => {
        if (c.id === id || c.handle === id) {
          return { ...c, ...data };
        }
        return c;
      });
      localStorage.setItem(STORAGE_KEY_CREATORS, JSON.stringify(creators));
      this.dispatchChange();
    },

    // Brands
    getBrands() {
      this.init();
      try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY_BRANDS)) || DEFAULT_BRANDS;
      } catch (e) {
        return DEFAULT_BRANDS;
      }
    },

    getBrand(id) {
      return this.getBrands().find(b => b.id === id) || this.getBrands()[0];
    },

    // Campaigns
    getCampaigns() {
      this.init();
      try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY_CAMPAIGNS)) || DEFAULT_CAMPAIGNS;
      } catch (e) {
        return DEFAULT_CAMPAIGNS;
      }
    },

    getCampaign(id) {
      return this.getCampaigns().find(c => c.id === id);
    },

    getCampaignsByCreator(creatorId) {
      return this.getCampaigns().filter(c => c.creatorId === creatorId || c.creatorHandle === creatorId);
    },

    getCampaignsByBrand(brandId) {
      return this.getCampaigns().filter(c => c.brandId === brandId);
    },

    createCampaign(campaignData) {
      const campaigns = this.getCampaigns();
      const newCamp = {
        id: "camp_" + Date.now(),
        status: "Invited",
        timeline: [
          { stage: "Interested", at: new Date().toISOString() },
          { stage: "Invited", at: new Date().toISOString() }
        ],
        draftUrl: "",
        draftNotes: "",
        revisions: [],
        publishedUrl: "",
        metrics: { views: 0, likes: 0, comments: 0, saves: 0, shares: 0 },
        ...campaignData
      };
      campaigns.unshift(newCamp);
      localStorage.setItem(STORAGE_KEY_CAMPAIGNS, JSON.stringify(campaigns));
      this.dispatchChange();
      return newCamp;
    },

    updateCampaign(id, updates) {
      const campaigns = this.getCampaigns().map(camp => {
        if (camp.id === id) {
          const updated = { ...camp, ...updates };
          // If status changed, append to timeline
          if (updates.status && updates.status !== camp.status) {
            updated.timeline = updated.timeline || [];
            updated.timeline.push({
              stage: updates.status,
              at: new Date().toISOString()
            });
          }
          return updated;
        }
        return camp;
      });
      localStorage.setItem(STORAGE_KEY_CAMPAIGNS, JSON.stringify(campaigns));
      this.dispatchChange();
    },

    // Specific Workflow Stage Transitions
    acceptCampaign(campId) {
      this.updateCampaign(campId, { status: "Accepted" });
    },

    declineCampaign(campId, reason) {
      this.updateCampaign(campId, { status: "Declined", declineReason: reason || "Creator declined invite" });
    },

    submitDraft(campId, draftUrl, draftNotes) {
      this.updateCampaign(campId, {
        status: "Submitted",
        draftUrl,
        draftNotes
      });
    },

    requestRevision(campId, revisionNote) {
      const camp = this.getCampaign(campId);
      if (!camp) return;
      const revisions = camp.revisions || [];
      revisions.push({
        requestedAt: new Date().toISOString(),
        note: revisionNote,
        resolved: false
      });
      this.updateCampaign(campId, {
        status: "Revision Required",
        revisions
      });
    },

    approveDraft(campId) {
      this.updateCampaign(campId, { status: "Approved" });
    },

    submitPublished(campId, publishedUrl, metrics) {
      this.updateCampaign(campId, {
        status: "Published",
        publishedUrl,
        metrics: metrics || { views: 150000, likes: 11000, comments: 450, saves: 2100, shares: 980 }
      });
    },

    markPaid(campId) {
      this.updateCampaign(campId, { status: "Paid" });
    },

    // Event system for real-time reactivity between browser windows/tabs
    dispatchChange() {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("aroha:datachanged"));
      }
    },

    onDataChange(callback) {
      if (typeof window !== "undefined") {
        window.addEventListener("aroha:datachanged", callback);
        window.addEventListener("storage", callback);
      }
    },

    // Statistics / Calculations Helpers
    calcCPV(cost, views) {
      if (!views || views <= 0) return "—";
      return "₹" + (cost / views).toFixed(2);
    },

    calcCPE(cost, engagements) {
      if (!engagements || engagements <= 0) return "—";
      return "₹" + (cost / engagements).toFixed(2);
    },

    formatCurrency(amount) {
      return "₹" + Number(amount || 0).toLocaleString("en-IN");
    },

    formatCompact(num) {
      if (!num) return "0";
      if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
      if (num >= 1000) return (num / 1000).toFixed(1) + "K";
      return String(num);
    }
  };

  // Auto initialize
  ArohaStore.init();

  // Export to global scope
  global.ArohaStore = ArohaStore;

})(typeof window !== "undefined" ? window : this);

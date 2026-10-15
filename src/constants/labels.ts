/**
 * Centralized UI Terminology and Interaction Labels
 * Single Source of Truth for consistent, user-friendly copy across Notsopedia
 */

export const UI_LABELS = {
  navigation: {
    exploreNotes: "Explore Notes",
    aiTutor: "AI Tutor",
    admin: "Admin",
    adminConsole: "Admin Console",
    home: "Home",
  },
  actions: {
    uploadNotes: "Upload Notes",
    signIn: "Sign In",
    createAccount: "Create Account",
    signOut: "Sign Out",
    downloadPresentation: "Download Presentation",
    createPresentation: "Create Presentation",
    compilingPresentation: "Creating Presentation...",
    downloadMarkdown: "Download Markdown",
    clearFilters: "Clear Filters",
    saveChanges: "Save Changes",
    cancel: "Cancel",
    delete: "Delete",
    close: "Close",
    read: "Read",
    like: "Like",
    unlike: "Unlike",
    edit: "Edit",
    send: "Send",
    back: "Back",
    openAttachment: "Open Attachment",
    search: "Search Notes",
    generateFlashcards: "Generate Flashcards",
    generatingFlashcards: "Generating Flashcards...",
  },
  flashcards: {
    title: "Study Flashcards",
    flipPrompt: "Click card or press Space to flip",
    needReview: "Need to Review",
    knowIt: "Know It",
    shuffle: "Shuffle Deck",
    restart: "Restart Deck",
    summaryTitle: "Deck Complete!",
    reviewWeakOnly: "Review Weak Cards",
    studyAgain: "Study Deck Again",
  },
  filters: {
    allSubjects: "All Subjects",
    hasAttachments: "Has Attachments",
    sortBy: "Sort by",
    sortNewest: "Newest First",
    sortLikes: "Most Liked",
    sortTitle: "Title (A–Z)",
  },
  reader: {
    title: "Document Reader",
    fontSizeNormal: "A",
    fontSizeLarge: "A+",
    fontSizeXLarge: "A++",
  },
  empty: {
    noMatchingNotesTitle: "No matching notes found",
    noMatchingNotesDesc:
      "We couldn't find any study notes matching your active criteria. Try broadening your keywords, unchecking filters, or clearing all criteria.",
    emptyLibraryTitle: "Your study library is currently empty",
    emptyLibraryDesc:
      "Be the first to share notes, study blueprints, or syllabi with the community.",
  },
  auth: {
    signInTitle: "Sign In to Notsopedia",
    signInSubtitle: "Access your saved notes, likes, and study discussions",
    createAccountTitle: "Create Your Account",
    createAccountSubtitle: "Join the collaborative study library today",
    forgotPasswordTitle: "Reset Your Password",
    forgotPasswordSubtitle: "Enter your email to receive a password reset link",
    continueWithGoogle: "Continue with Google",
    alreadyHaveAccount: "Already have an account? Sign In",
    dontHaveAccount: "Don't have an account? Create Account",
    forgotPasswordLink: "Forgot password?",
  },
} as const;

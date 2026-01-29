/**
 * Creative loading phrases for Donna's thinking indicator
 * Grouped by theme, reflecting Donna's personality: personal, curious, no-BS, never robotic
 */

// Organizing & Sorting
const organizingPhrases = [
  "Alphabetizing your chaos...",
  "Marie Kondo-ing your thoughts...",
  "Untangling the spaghetti of life...",
  "Finding patterns in the beautiful mess...",
  "Sorting through the noise...",
  "Organizing your mental tabs...",
  "Decluttering the brain space...",
  "Filing this under 'important'...",
  "Creating order from entropy...",
  "Tidying up loose ends...",
  "Cataloging the chaos...",
  "Connecting the scattered dots...",
  "Weaving threads together...",
  "Mapping the terrain...",
  "Structuring the unstructured...",
  "Building your personal wiki...",
  "Indexing the important bits...",
  "Cross-referencing everything...",
  "Herding your mental cats...",
  "Arranging the puzzle pieces...",
]

// Thinking & Processing
const processingPhrases = [
  "Consulting my inner librarian...",
  "Letting that marinate...",
  "Noodling on this one...",
  "Giving this the attention it deserves...",
  "Processing with care...",
  "Chewing on that thought...",
  "Mulling this over...",
  "Running the mental math...",
  "Connecting synapses...",
  "Brewing up something good...",
  "Parsing the possibilities...",
  "Weighing the options...",
  "Considering all angles...",
  "Diving into the details...",
  "Thinking out loud (quietly)...",
  "Synthesizing the intel...",
  "Crunching the context...",
  "Assembling the answer...",
  "Working through the layers...",
  "Reading between the lines...",
]

// Playful & Cheeky
const playfulPhrases = [
  "Hold my coffee...",
  "Almost done being clever...",
  "You're gonna love this...",
  "Worth the wait, promise...",
  "One sec, being brilliant...",
  "Warming up the magic...",
  "Sharpening my pencils...",
  "Putting on my thinking cap...",
  "Rolling up my sleeves...",
  "Getting into the zone...",
  "Charging the creativity...",
  "Activating big brain mode...",
  "Loading awesomeness...",
  "Summoning the wisdom...",
  "Cooking something special...",
  "Bear with me here...",
  "Stay tuned...",
  "This is the fun part...",
  "Almost there, pinky promise...",
  "Working some magic...",
]

// Life Management
const lifeManagementPhrases = [
  "Planning your world domination...",
  "Doing the boring stuff so you don't have to...",
  "Saving you from yourself...",
  "Remembering what you forgot to remember...",
  "Being your external brain...",
  "Keeping the plates spinning...",
  "Tracking your brilliant ideas...",
  "Managing the mayhem...",
  "Keeping you on track...",
  "Juggling your priorities...",
  "Future-proofing your plans...",
  "Guarding your focus...",
  "Handling the details...",
  "Covering all your bases...",
  "Watching your back...",
  "Making sense of the madness...",
  "Keeping the chaos at bay...",
  "Protecting your time...",
  "Streamlining your life...",
  "Getting your ducks in a row...",
]

// Philosophical & Quirky
const philosophicalPhrases = [
  "Pondering the universe (and your to-do list)...",
  "Finding meaning in the madness...",
  "Dancing with complexity...",
  "Embracing the beautiful chaos...",
  "Questioning everything (productively)...",
  "Seeking clarity in the fog...",
  "Appreciating the nuance...",
  "Finding the signal in the noise...",
  "Honoring the complexity...",
  "Sitting with uncertainty...",
  "Exploring the rabbit hole...",
  "Following the thread...",
  "Trusting the process...",
  "Embracing the journey...",
  "Finding flow...",
]

// Donna-Specific
const donnaPhrases = [
  "Donna's on it...",
  "Pulling strings behind the scenes...",
  "Being genuinely helpful (novel concept)...",
  "Doing what I do best...",
  "Your personal AI, at your service...",
  "On the case...",
  "Working my magic...",
  "Tapping into the knowledge base...",
  "Scanning the archives...",
  "Retrieving the good stuff...",
  "Leveraging everything I know...",
  "Bringing it all together...",
  "Making connections you didn't see...",
  "Reading your mind (not literally)...",
  "Already three steps ahead...",
]

/**
 * All thinking phrases combined
 */
export const thinkingPhrases: string[] = [
  ...organizingPhrases,
  ...processingPhrases,
  ...playfulPhrases,
  ...lifeManagementPhrases,
  ...philosophicalPhrases,
  ...donnaPhrases,
]

/**
 * Fisher-Yates shuffle algorithm for randomizing phrases
 * Returns a new shuffled array without mutating the original
 */
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

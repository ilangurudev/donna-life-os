import { create } from 'zustand'
import type { FileNode } from '../types'

interface NotesNavState {
  // Note path to navigate to (set from anywhere, consumed by App)
  pendingNavigation: string | null
  // Map from normalized name (e.g., "optimization-project") to full path (e.g., "projects/optimization-project.md")
  pathLookup: Record<string, string>
  // Request navigation to a note
  navigateToNote: (path: string) => void
  // Clear the pending navigation (called after handling)
  clearNavigation: () => void
  // Update the path lookup from file tree
  updatePathLookup: (fileTree: FileNode) => void
  // Resolve a wikilink name to a full path
  resolveWikiLink: (linkText: string) => string | null
}

// Helper to extract all file paths from file tree
function extractFilePaths(node: FileNode, paths: Record<string, string> = {}): Record<string, string> {
  if (node.type === 'file') {
    // Store by normalized name (lowercase, no extension)
    const normalizedName = node.name.toLowerCase()
    paths[normalizedName] = node.path
  } else if (node.children) {
    for (const child of node.children) {
      extractFilePaths(child, paths)
    }
  }
  return paths
}

export const useNotesNav = create<NotesNavState>((set, get) => ({
  pendingNavigation: null,
  pathLookup: {},

  navigateToNote: (path) => set({ pendingNavigation: path }),

  clearNavigation: () => set({ pendingNavigation: null }),

  updatePathLookup: (fileTree) => {
    const paths = extractFilePaths(fileTree)
    set({ pathLookup: paths })
  },

  resolveWikiLink: (linkText) => {
    const { pathLookup } = get()
    // Normalize: lowercase, replace spaces with hyphens
    const normalized = linkText.toLowerCase().replace(/\s+/g, '-')
    return pathLookup[normalized] || null
  },
}))

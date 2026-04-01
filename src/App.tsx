import { ThemeProvider } from '@/components/theme-provider'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { ArrowLeft01Icon, Folder02Icon, PlusSignIcon, MoreVerticalIcon, Delete02Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { useEffect, useRef, useState } from 'react'
import { dbDeleteNote, dbFetchNotes, dbInsertNote, dbUpdateNote, dbFetchFolders, dbCreateFolder, dbDeleteFolder, type Note } from './lib/db'
import './App.css'

const AUTOSAVE_DELAY = 2000

export default function App() {
  const [folder, setFolder] = useState('Notes')
  const [folders, setFolders] = useState<string[]>([])
  const [creatingFolder, setCreatingFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [notes, setNotes] = useState<Note[]>([])
  const [activeId, setActiveId] = useState<number | null>(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<
    | { type: 'note'; id: number }
    | { type: 'folder'; name: string }
    | null
  >(null)

  const activeIdRef = useRef<number | null>(null)
  const titleRef = useRef('')
  const contentRef = useRef('')
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const folderRef = useRef('Notes')

  useEffect(() => { titleRef.current = title }, [title])
  useEffect(() => { contentRef.current = content }, [content])
  useEffect(() => { activeIdRef.current = activeId }, [activeId])
  useEffect(() => { folderRef.current = folder }, [folder])

  async function loadFolders() {
    const data = await dbFetchFolders()
    setFolders(data)
  }

  useEffect(() => { loadFolders() }, [])

  async function handleCreateFolder() {
    const name = newFolderName.trim()
    if (!name || name === 'Notes') return
    await dbCreateFolder(name)
    await loadFolders()
    setNewFolderName('')
    setCreatingFolder(false)
    setFolder(name)
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    if (deleteTarget.type === 'note') {
      await dbDeleteNote(deleteTarget.id)
      await loadNotes(folder)
    } else {
      await dbDeleteFolder(deleteTarget.name)
      await loadFolders()
      if (folder === deleteTarget.name) setFolder('Notes')
    }
    setDeleteTarget(null)
  }

  async function loadNotes(f: string) {
    const data = await dbFetchNotes(f)
    setNotes(data)
  }

  useEffect(() => { loadNotes(folder) }, [folder])

  function scheduleAutosave() {
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current)
    autosaveTimer.current = setTimeout(() => save(), AUTOSAVE_DELAY)
  }

  async function save(): Promise<number | null> {
    const t = titleRef.current
    const c = contentRef.current
    const id = activeIdRef.current
    const f = folderRef.current

    if (!t && !c) return null
    setSaving(true)

    try {
      if (id === null) {
        const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
        const newId = await dbInsertNote(t, c, f, today)
        activeIdRef.current = newId
        setActiveId(newId)
        await loadNotes(f)
        return newId
      } else {
        await dbUpdateNote(id, t, c)
        await loadNotes(f)
        return id
      }
    } catch (err) {
      console.error('Save failed:', err)
      return null
    } finally {
      setSaving(false)
    }
  }

  async function openNote(note: Note) {
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current)
    await save()
    setActiveId(note.id)
    setTitle(note.title)
    setContent(note.content)
    setIsEditing(true)
  }

  function newNote() {
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current)
    setActiveId(null)
    setTitle('')
    setContent('')
    setIsEditing(true)
  }

  async function goBack() {
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current)

    const isEmpty = !titleRef.current.trim() && !contentRef.current.trim()
    const id = activeIdRef.current

    if (isEmpty && id !== null) {
      await dbDeleteNote(id)
      await loadNotes(folderRef.current)
    } else {
      save() // fire and forget as before
    }
    
    setActiveId(null)
    setTitle('')
    setContent('')
    setIsEditing(false)
    save()  // fire and forget — no await
  }

  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <div className="flex h-screen w-full bg-background overflow-hidden">
        <aside className="w-64 border-r flex flex-col p-4">
          <div className="flex items-center gap-2 mb-6 px-2 font-semibold text-lg">
            <div className="w-3 h-3 rounded-full bg-yellow-500" /> Kilovate Notes
          </div>

          <nav className="space-y-1">
            {/* Hardcoded default */}
            <Button
              variant={folder === 'Notes' ? 'secondary' : 'ghost'}
              className={`w-full justify-start gap-2 ${folder === 'Notes' ? '!text-[#F0B100]' : 'text-muted-foreground'}`}
              onClick={() => { setFolder('Notes'); setActiveId(null); setTitle(''); setContent(''); setIsEditing(false) }}
            >
              <HugeiconsIcon icon={Folder02Icon} width={16} height={16} strokeWidth={2} color={folder === 'Notes' ? '#F0B100' : 'currentColor'} />
              Notes
            </Button>

            {/* Dynamic folders */}
            {folders.map((f) => (
              <div key={f} className="flex items-center group/folder">
                <Button
                  variant={folder === f ? 'secondary' : 'ghost'}
                  className={`flex-1 justify-start gap-2 ${folder === f ? '!text-[#F0B100]' : 'text-muted-foreground'}`}
                  onClick={() => { setFolder(f); setActiveId(null); setTitle(''); setContent(''); setIsEditing(false) }}
                >
                  <HugeiconsIcon icon={Folder02Icon} width={16} height={16} strokeWidth={2} color={folder === f ? '#F0B100' : 'currentColor'} />
                  {f}
                </Button>
                <button
                  className="opacity-0 group-hover/folder:opacity-100 transition-opacity p-1 text-muted-foreground hover:text-destructive"
                  onClick={() => setDeleteTarget({ type: 'folder', name: f })}
                >
                  <HugeiconsIcon icon={Delete02Icon} width={14} height={14} strokeWidth={2} />
                </button>
              </div>
            ))}
          </nav>

          <div className="mt-auto pt-4 border-t">
            {creatingFolder ? (
              <div className="flex gap-2">
                <input
                  className="flex w-full text-sm bg-transparent border-b border-border outline-none px-1 py-0.5"
                  placeholder="Folder name"
                  value={newFolderName}
                  autoFocus
                  onBlur={() => { setCreatingFolder(false); setNewFolderName('') }}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreateFolder()
                    if (e.key === 'Escape') { setCreatingFolder(false); setNewFolderName('') }
                  }}
                />
                <button
                  className="text-xs px-1 text-muted-foreground hover:text-primary"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={handleCreateFolder}
                >
                  Add
                </button>
              </div>
            ) : (
              <Button
                variant="ghost"
                className="w-full justify-start gap-2 text-muted-foreground"
                onClick={() => setCreatingFolder(true)}
              >
                <HugeiconsIcon icon={PlusSignIcon} width={16} height={16} strokeWidth={2} />
                New Folder
              </Button>
            )}
          </div>
        </aside>
        <main className="flex-1 h-screen flex flex-col overflow-hidden">
          <header className="h-14 border-b flex items-center justify-between px-6 bg-background/50 backdrop-blur">
            {isEditing ? (
              <Button variant="ghost" size="sm" onClick={goBack}>
                <HugeiconsIcon icon={ArrowLeft01Icon} width={18} height={18} strokeWidth={2} /> Back
              </Button>
            ) : (
              <h2 className="font-semibold">{folder}</h2>
            )}
            <div className="flex items-center gap-3">
              {isEditing && (
                <span className="text-xs text-muted-foreground">{saving ? 'Saving...' : 'Saved'}</span>
              )}
              <Button size="sm" onClick={isEditing ? save : newNote}>
                <HugeiconsIcon icon={PlusSignIcon} width={16} height={16} strokeWidth={2} />
                {isEditing ? 'Save' : 'New Note'}
              </Button>
            </div>
          </header>
          <ScrollArea className="flex-1 w-full h-full pb-6">
            <div className="p-6">
              {!isEditing ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {notes.map((note) => (
                    <Card
                      key={note.id}
                      className="p-4 cursor-pointer hover:ring-2 ring-primary transition-all group"
                      onClick={() => openNote(note)}
                    >
                      <div className='flex items-center justify-between mb-2'>
                        <h3 className="font-bold group-hover:text-primary">{note.title || 'Untitled'}</h3>
                        <DropdownMenu>
                          <DropdownMenuTrigger>
                            <Button
                              size='icon'
                              className="flex items-center leading-none text-muted-foreground bg-transparent hover:text-primary rounded opacity-48 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <HugeiconsIcon icon={MoreVerticalIcon} width={16} height={16} strokeWidth={2} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openNote(note) }}>
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation()
                                setDeleteTarget({ type: 'note', id: note.id })
                              }}
                            >
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-3">{note.content}</p>
                      <div className="mt-4 text-[10px] uppercase tracking-wider text-muted-foreground">{note.date}</div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="w-full mx-auto animate-in fade-in slide-in-from-bottom-2">
                  <input
                    className="w-full text-1rem font-bold text-muted-foreground bg-transparent border-none outline-none mb-6"
                    placeholder="Untitled"
                    value={title}
                    onChange={(e) => { setTitle(e.target.value); scheduleAutosave() }}
                    autoFocus
                  />
                  <textarea
                    className="w-full h-[60vh] bg-transparent border-none outline-none resize-none text-1rem text-muted-foreground leading-relaxed"
                    placeholder="Start typing your thoughts..."
                    value={content}
                    onChange={(e) => { setContent(e.target.value); scheduleAutosave() }}
                  />
                </div>
              )}
            </div>
          </ScrollArea>
        </main>
      </div>
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deleteTarget?.type === 'folder' ? 'Delete folder?' : 'Delete note?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.type === 'folder'
                ? `"${deleteTarget.name}" and all its notes will be permanently deleted.`
                : 'This note will be permanently deleted.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={confirmDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ThemeProvider>
  )
}
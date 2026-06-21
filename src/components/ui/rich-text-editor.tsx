'use client'

import React from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import Youtube from '@tiptap/extension-youtube'
import {
  Bold, Italic, Strikethrough, Heading1, Heading2,
  List, ListOrdered, Quote, Undo, Redo, Link as LinkIcon,
  Image as ImageIcon, Youtube as YoutubeIcon, Code,
  AlertTriangle, Info, CheckCircle2, MessageSquareWarning, ChevronDown
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { Callout } from './tiptap-extensions/callout'

interface RichTextEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
  className?: string
}

export function RichTextEditor({ content, onChange, placeholder = 'Start writing...', className }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Callout,
      Image.configure({
        HTMLAttributes: {
          class: 'rounded-xl max-w-full my-4 border border-border/50',
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline underline-offset-4 decoration-primary/30 hover:decoration-primary',
        },
      }),
      Youtube.configure({
        HTMLAttributes: {
          class: 'w-full aspect-video rounded-xl my-4',
        },
      }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass: 'is-editor-empty',
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-sm md:prose-base dark:prose-invert max-w-none focus:outline-none min-h-[150px] p-4',
          className
        ),
      },
    },
  })

  if (!editor) return null

  const addImage = () => {
    const url = window.prompt('URL of the image:')
    if (url) {
      editor.chain().focus().setImage({ src: url }).run()
    }
  }

  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href
    const url = window.prompt('URL', previousUrl)
    if (url === null) return
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }

  const addYoutube = () => {
    const url = window.prompt('YouTube URL:')
    if (url) {
      editor.chain().focus().setYoutubeVideo({ src: url }).run()
    }
  }

  return (
    <div className="border border-border/40 rounded-xl overflow-hidden bg-background">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 border-b border-border/40 bg-muted/20">
        <Button
          variant="ghost" size="icon"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={cn('size-8', editor.isActive('bold') && 'bg-muted')}
        >
          <Bold className="size-4" />
        </Button>
        <Button
          variant="ghost" size="icon"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={cn('size-8', editor.isActive('italic') && 'bg-muted')}
        >
          <Italic className="size-4" />
        </Button>
        <Button
          variant="ghost" size="icon"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={cn('size-8', editor.isActive('strike') && 'bg-muted')}
        >
          <Strikethrough className="size-4" />
        </Button>
        <Button
          variant="ghost" size="icon"
          onClick={() => editor.chain().focus().toggleCode().run()}
          className={cn('size-8', editor.isActive('code') && 'bg-muted')}
        >
          <Code className="size-4" />
        </Button>
        
        <div className="w-px h-6 bg-border/40 mx-1" />
        
        <Button
          variant="ghost" size="icon"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={cn('size-8', editor.isActive('heading', { level: 1 }) && 'bg-muted')}
        >
          <Heading1 className="size-4" />
        </Button>
        <Button
          variant="ghost" size="icon"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={cn('size-8', editor.isActive('heading', { level: 2 }) && 'bg-muted')}
        >
          <Heading2 className="size-4" />
        </Button>
        
        <div className="w-px h-6 bg-border/40 mx-1" />

        <Button
          variant="ghost" size="icon"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={cn('size-8', editor.isActive('bulletList') && 'bg-muted')}
        >
          <List className="size-4" />
        </Button>
        <Button
          variant="ghost" size="icon"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={cn('size-8', editor.isActive('orderedList') && 'bg-muted')}
        >
          <ListOrdered className="size-4" />
        </Button>
        <Button
          variant="ghost" size="icon"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={cn('size-8', editor.isActive('blockquote') && 'bg-muted')}
        >
          <Quote className="size-4" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 gap-1 px-2">
              <MessageSquareWarning className="size-4" />
              <ChevronDown className="size-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-36 rounded-xl">
            <DropdownMenuItem onClick={() => editor.chain().focus().setCallout({ type: 'info' }).run()}>
              <Info className="size-4 mr-2 text-blue-500" /> Info
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => editor.chain().focus().setCallout({ type: 'success' }).run()}>
              <CheckCircle2 className="size-4 mr-2 text-emerald-500" /> Success
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => editor.chain().focus().setCallout({ type: 'warning' }).run()}>
              <AlertTriangle className="size-4 mr-2 text-amber-500" /> Warning
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => editor.chain().focus().setCallout({ type: 'error' }).run()}>
              <AlertTriangle className="size-4 mr-2 text-rose-500" /> Error
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        <div className="w-px h-6 bg-border/40 mx-1" />

        <Button variant="ghost" size="icon" onClick={setLink} className={cn('size-8', editor.isActive('link') && 'bg-muted')}>
          <LinkIcon className="size-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={addImage} className="size-8">
          <ImageIcon className="size-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={addYoutube} className="size-8">
          <YoutubeIcon className="size-4" />
        </Button>
        
        <div className="flex-1" />
        
        <Button
          variant="ghost" size="icon"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="size-8 disabled:opacity-50"
        >
          <Undo className="size-4" />
        </Button>
        <Button
          variant="ghost" size="icon"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="size-8 disabled:opacity-50"
        >
          <Redo className="size-4" />
        </Button>
      </div>

      {/* Editor Area */}
      <EditorContent editor={editor} className="min-h-[200px] cursor-text" onClick={() => editor.commands.focus()} />
      <style dangerouslySetInnerHTML={{__html: `
        .is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #adb5bd;
          pointer-events: none;
          height: 0;
        }
      `}} />
    </div>
  )
}

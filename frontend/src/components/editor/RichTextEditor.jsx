import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import TextStyle from '@tiptap/extension-text-style'
import Color from '@tiptap/extension-color'
import Highlight from '@tiptap/extension-highlight'
import Link from '@tiptap/extension-link'
import Table from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import OrderedList from '@tiptap/extension-ordered-list'
import BulletList from '@tiptap/extension-bullet-list'
import Image from '@tiptap/extension-image'
import { useEffect, useRef } from 'react'

// ── Custom Table dengan atribut borderless ────────────────────────────────────
const CustomTable = Table.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      borderless: {
        default: false,
        parseHTML: el => el.getAttribute('data-borderless') === 'true',
        renderHTML: attrs => attrs.borderless
          ? { 'data-borderless': 'true', class: 'borderless-table' }
          : {},
      },
    }
  },
})

// ── Custom OrderedList dengan listStyleType ───────────────────────────────────
const CustomOrderedList = OrderedList.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      listStyleType: {
        default: 'decimal',
        parseHTML: el => el.style.listStyleType || el.getAttribute('data-list-style') || 'decimal',
        renderHTML: attrs => ({
          style: `list-style-type: ${attrs.listStyleType}`,
          'data-list-style': attrs.listStyleType,
        }),
      },
    }
  },
})

// ── Custom BulletList dengan bulletChar ───────────────────────────────────────
const CustomBulletList = BulletList.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      bulletChar: {
        default: '•',
        parseHTML: el => el.getAttribute('data-bullet-char') || '•',
        renderHTML: attrs => ({ 'data-bullet-char': attrs.bulletChar }),
      },
    }
  },
})

// ── Toolbar button ────────────────────────────────────────────────────────────
const ToolbarButton = ({ onClick, active, title, children, disabled }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={`p-1.5 rounded text-sm font-medium transition-colors ${
      active
        ? 'bg-primary-100 text-primary-700'
        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
    } disabled:opacity-40 disabled:cursor-not-allowed`}
  >
    {children}
  </button>
)

const Divider = () => <div className="w-px h-5 bg-gray-200 mx-1" />

const BULLET_TYPES = [
  { char: '•', label: '•',  title: 'Bullet (•)' },
  { char: '-', label: '–',  title: 'Dash (-)' },
]

const LIST_TYPES = [
  { type: 'decimal',     label: '1.', title: 'Angka (1, 2, 3)' },
  { type: 'upper-alpha', label: 'A.', title: 'Huruf Besar (A, B, C)' },
  { type: 'lower-alpha', label: 'a.', title: 'Huruf Kecil (a, b, c)' },
  { type: 'upper-roman', label: 'I.', title: 'Romawi Besar (I, II, III)' },
  { type: 'lower-roman', label: 'i.', title: 'Romawi Kecil (i, ii, iii)' },
]

export default function RichTextEditor({
  value, onChange,
  placeholder = 'Tulis di sini...',
  minHeight = '200px',
  readOnly = false,
}) {
  const imgInputRef = useRef(null)
  const editor = useEditor({    extensions: [
      StarterKit.configure({ orderedList: false, bulletList: false }),
      CustomOrderedList,
      CustomBulletList,
      Underline,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Link.configure({ openOnClick: false }),
      CustomTable.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      Image.configure({ inline: false, allowBase64: true }),
    ],
    content: value || '',
    editable: !readOnly,
    onUpdate: ({ editor }) => { onChange?.(editor.getHTML()) },
    editorProps: {
      attributes: {
        class: 'focus:outline-none',
        style: `min-height: ${minHeight}; padding: 12px 16px; font-size: 14px; line-height: 1.6;`,
        'data-placeholder': placeholder,
      },
    },
  })

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || '', false)
    }
  }, [value])

  if (!editor) return null

  if (readOnly) {
    return (
      <div className="tiptap-editor border-0">
        <EditorContent editor={editor} />
      </div>
    )
  }

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const addTable = () =>
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()

  const toggleTableBorder = () => {
    const current = editor.getAttributes('table').borderless || false
    editor.chain().focus().updateAttributes('table', { borderless: !current }).run()
  }

  const setLink = () => {
    const url = window.prompt('Masukkan URL:')
    if (url) editor.chain().focus().setLink({ href: url }).run()
  }

  // Insert gambar dari file lokal (base64)
  const handleImageFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const src = ev.target.result
      editor.chain().focus().setImage({ src }).run()
    }
    reader.readAsDataURL(file)
    e.target.value = '' // reset agar bisa pilih file yang sama lagi
  }

  // Insert gambar dari URL
  const insertImageUrl = () => {
    const url = window.prompt('Masukkan URL gambar:')
    if (url) editor.chain().focus().setImage({ src: url }).run()
  }

  const toggleBulletList = (bulletChar) => {
    const isActive   = editor.isActive('bulletList')
    const currentChar = editor.getAttributes('bulletList').bulletChar || '•'
    if (isActive && currentChar === bulletChar) {
      editor.chain().focus().toggleBulletList().run()
    } else if (isActive) {
      editor.chain().focus().updateAttributes('bulletList', { bulletChar }).run()
    } else {
      editor.chain().focus().toggleBulletList().updateAttributes('bulletList', { bulletChar }).run()
    }
  }

  const toggleOrderedList = (listStyleType) => {
    const isActive   = editor.isActive('orderedList')
    const currentType = editor.getAttributes('orderedList').listStyleType || 'decimal'
    if (isActive && currentType === listStyleType) {
      editor.chain().focus().liftListItem('listItem').run()
    } else if (isActive) {
      editor.chain().focus().updateAttributes('orderedList', { listStyleType }).run()
    } else {
      editor.chain().focus().toggleOrderedList().updateAttributes('orderedList', { listStyleType }).run()
    }
  }

  const isInTable       = editor.isActive('table')
  const isTableBorderless = isInTable && (editor.getAttributes('table').borderless === true)
  const currentListType = editor.isActive('orderedList')
    ? (editor.getAttributes('orderedList').listStyleType || 'decimal') : null
  const currentBulletChar = editor.isActive('bulletList')
    ? (editor.getAttributes('bulletList').bulletChar || '•') : null

  return (
    <div className="tiptap-editor">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 px-3 py-2 border-b border-gray-200 bg-gray-50">

        {/* Format teks */}
        <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold"><strong>B</strong></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic"><em>I</em></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Underline"><span className="underline">U</span></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Strikethrough"><span className="line-through">S</span></ToolbarButton>

        <Divider />

        {/* Heading */}
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })} title="Heading 1">H1</ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="Heading 2">H2</ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="Heading 3">H3</ToolbarButton>

        <Divider />

        {/* Alignment */}
        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('left').run()}    active={editor.isActive({ textAlign: 'left' })}    title="Rata Kiri">≡</ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('center').run()}  active={editor.isActive({ textAlign: 'center' })}  title="Tengah">≡</ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('right').run()}   active={editor.isActive({ textAlign: 'right' })}   title="Rata Kanan">≡</ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('justify').run()} active={editor.isActive({ textAlign: 'justify' })} title="Rata Kanan-Kiri">≡</ToolbarButton>

        <Divider />

        {/* Bullet list */}
        {BULLET_TYPES.map(({ char, label, title }) => (
          <ToolbarButton key={char} onClick={() => toggleBulletList(char)} active={currentBulletChar === char} title={title}>
            <span className="text-xs font-mono">{label} ≡</span>
          </ToolbarButton>
        ))}

        {/* Ordered list */}
        {LIST_TYPES.map(({ type, label, title }) => (
          <ToolbarButton key={type} onClick={() => toggleOrderedList(type)} active={currentListType === type} title={title}>
            <span className="text-xs font-mono">{label}</span>
          </ToolbarButton>
        ))}

        <Divider />

        {/* Blockquote & Link */}
        <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Kutipan">❝</ToolbarButton>
        <ToolbarButton onClick={setLink} active={editor.isActive('link')} title="Tambah Link">🔗</ToolbarButton>

        {/* Insert gambar */}
        <ToolbarButton onClick={() => imgInputRef.current?.click()} title="Sisipkan Gambar dari File">🖼</ToolbarButton>
        <ToolbarButton onClick={insertImageUrl} title="Sisipkan Gambar dari URL">🌐</ToolbarButton>
        <input ref={imgInputRef} type="file" accept="image/*" onChange={handleImageFile} className="hidden" />

        <Divider />

        {/* Tabel — sisipkan & hapus */}
        <ToolbarButton onClick={addTable} title="Sisipkan Tabel">⊞</ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().deleteTable().run()} disabled={!editor.can().deleteTable()} title="Hapus Tabel">✕⊞</ToolbarButton>

        {/* Tabel — kolom */}
        <ToolbarButton onClick={() => editor.chain().focus().addColumnBefore().run()} disabled={!editor.can().addColumnBefore()} title="Tambah Kolom Kiri">◁+</ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().addColumnAfter().run()}  disabled={!editor.can().addColumnAfter()}  title="Tambah Kolom Kanan">+▷</ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().deleteColumn().run()}    disabled={!editor.can().deleteColumn()}    title="Hapus Kolom">✕↕</ToolbarButton>

        {/* Tabel — baris */}
        <ToolbarButton onClick={() => editor.chain().focus().addRowBefore().run()} disabled={!editor.can().addRowBefore()} title="Tambah Baris Atas">↑+</ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().addRowAfter().run()}  disabled={!editor.can().addRowAfter()}  title="Tambah Baris Bawah">+↓</ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().deleteRow().run()}    disabled={!editor.can().deleteRow()}    title="Hapus Baris">✕↔</ToolbarButton>

        {/* Tabel — merge & split */}
        <ToolbarButton
          onClick={() => editor.chain().focus().mergeCells().run()}
          disabled={!editor.can().mergeCells()}
          title="Gabung Sel"
        >
          <span className="text-xs">⊡→</span>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().splitCell().run()}
          disabled={!editor.can().splitCell()}
          title="Pisah Sel"
        >
          <span className="text-xs">←⊡</span>
        </ToolbarButton>

        {/* Tabel — toggle border */}
        <ToolbarButton
          onClick={toggleTableBorder}
          active={isTableBorderless}
          disabled={!isInTable}
          title={isTableBorderless ? 'Aktifkan Garis Tabel' : 'Hapus Garis Tabel'}
        >
          <span className="text-xs">⊡</span>
        </ToolbarButton>

        <Divider />

        {/* Undo/Redo */}
        <ToolbarButton onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo">↩</ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo">↪</ToolbarButton>
      </div>

      {/* Editor content */}
      <EditorContent editor={editor} />
    </div>
  )
}

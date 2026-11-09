import {useEffect,useRef} from 'react';
import {EditorContent,useEditor} from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import DOMPurify from 'dompurify';

export function RichTextEditor({value,onChange,disabled=false}:{value:string;onChange:(html:string)=>void;disabled?:boolean}){
 const timer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const editor=useEditor({extensions:[StarterKit,Underline,Link.configure({openOnClick:false,autolink:true})],content:DOMPurify.sanitize(value||'<p>Start writing your lesson…</p>'),editable:!disabled,onUpdate:({editor:e})=>{if(timer.current)clearTimeout(timer.current);const html=DOMPurify.sanitize(e.getHTML());timer.current=setTimeout(()=>onChange(html),500);},editorProps:{attributes:{class:'tiptap-content',role:'textbox','aria-label':'Rich text content','aria-multiline':'true'}}});
 useEffect(()=>{if(editor&&value!==editor.getHTML()&&value)editor.commands.setContent(DOMPurify.sanitize(value),false);},[editor,value]);
 useEffect(()=>()=>{if(timer.current)clearTimeout(timer.current);},[]);
 useEffect(()=>{editor?.setEditable(!disabled);},[editor,disabled]);
 if(!editor)return <div className="tiptap-loading">Loading editor…</div>;
 return <div className="rich-editor"><div className="rich-toolbar" role="toolbar" aria-label="Text formatting"><button type="button" aria-label="Bold" aria-pressed={editor.isActive('bold')} onClick={()=>editor.chain().focus().toggleBold().run()}><b>B</b></button><button type="button" aria-label="Italic" aria-pressed={editor.isActive('italic')} onClick={()=>editor.chain().focus().toggleItalic().run()}><i>I</i></button><button type="button" aria-label="Underline" aria-pressed={editor.isActive('underline')} onClick={()=>editor.chain().focus().toggleUnderline().run()}><u>U</u></button><button type="button" aria-label="Bullet list" onClick={()=>editor.chain().focus().toggleBulletList().run()}>• List</button><button type="button" aria-label="Ordered list" onClick={()=>editor.chain().focus().toggleOrderedList().run()}>1. List</button><button type="button" aria-label="Heading" onClick={()=>editor.chain().focus().toggleHeading({level:2}).run()}>H2</button><button type="button" aria-label="Blockquote" onClick={()=>editor.chain().focus().toggleBlockquote().run()}>❝</button><button type="button" aria-label="Code block" onClick={()=>editor.chain().focus().toggleCodeBlock().run()}>{'{}'}</button></div><EditorContent editor={editor}/></div>;
}

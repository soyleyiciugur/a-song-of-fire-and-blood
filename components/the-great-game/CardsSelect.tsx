"use client";
import {useEffect,useId,useRef,useState,type KeyboardEvent} from 'react';
import {createPortal} from 'react-dom';
import styles from './CardsSelect.module.css';
export type CardsSelectOption={value:string;label:string;disabled?:boolean};
export default function CardsSelect({value,options,onChange,ariaLabel,disabled=false}:{value:string;options:CardsSelectOption[];onChange:(value:string)=>void;ariaLabel:string;disabled?:boolean}){
  const [open,setOpen]=useState(false);const [position,setPosition]=useState<{left:number;top:number;width:number;maxHeight:number;transform?:string}|null>(null);
  const trigger=useRef<HTMLButtonElement>(null),menu=useRef<HTMLDivElement>(null);const id=useId();const typed=useRef({text:'',at:0});
  const close=(focus=false)=>{setOpen(false);if(focus)trigger.current?.focus();};
  useEffect(()=>{if(!open||disabled)return;const measure=()=>{const rect=trigger.current?.getBoundingClientRect();if(!rect)return;const viewport=window.visualViewport;const leftEdge=viewport?.offsetLeft??0,topEdge=viewport?.offsetTop??0;const width=viewport?.width??innerWidth,height=viewport?.height??innerHeight;const below=topEdge+height-rect.bottom-12,above=rect.top-topEdge-12;const down=below>=Math.min(240,above);const maxHeight=Math.max(60,Math.min(300,down?below:above));const w=Math.min(Math.max(rect.width,180),width-16);setPosition({left:Math.max(leftEdge+8,Math.min(rect.left,leftEdge+width-w-8)),top:down?rect.bottom+5:rect.top-5,transform:down?undefined:"translateY(-100%)",width:w,maxHeight});};
    const frame=requestAnimationFrame(measure);const outside=(e:PointerEvent)=>{if(!trigger.current?.contains(e.target as Node)&&!menu.current?.contains(e.target as Node))setOpen(false);};const scroll=(e:Event)=>{if(menu.current?.contains(e.target as Node))return;measure();};
    document.addEventListener('pointerdown',outside);window.addEventListener('resize',measure);window.addEventListener('scroll',scroll,true);window.visualViewport?.addEventListener('resize',measure);
    return()=>{cancelAnimationFrame(frame);document.removeEventListener('pointerdown',outside);window.removeEventListener('resize',measure);window.removeEventListener('scroll',scroll,true);window.visualViewport?.removeEventListener('resize',measure);};
  },[open,disabled,options.length]);
  const positioned = position !== null;
  useEffect(()=>{if(!open||!positioned)return;const frame=requestAnimationFrame(()=>{const selected=menu.current?.querySelector<HTMLButtonElement>('[aria-selected="true"]:not(:disabled)')??menu.current?.querySelector<HTMLButtonElement>('[role="option"]:not(:disabled)');selected?.focus({preventScroll:true});selected?.scrollIntoView({block:'nearest'});});return()=>cancelAnimationFrame(frame);},[open,positioned]);
  const keyDown=(e:KeyboardEvent)=>{
    if(e.key==='Escape'){e.preventDefault();e.stopPropagation();close(true);return;}
    if(e.key==='Tab'){close(true);return;}
    if(['ArrowDown','ArrowUp','Home','End'].includes(e.key)){e.preventDefault();if(!open){setPosition(null);setOpen(true);return;}const items=Array.from(menu.current?.querySelectorAll<HTMLButtonElement>('[role="option"]:not(:disabled)')??[]);if(!items.length)return;const index=items.indexOf(document.activeElement as HTMLButtonElement);const next=e.key==='Home'?0:e.key==='End'?items.length-1:(index+(e.key==='ArrowDown'?1:-1)+items.length)%items.length;items[next]?.focus();return;}
    if(open&&e.key.length===1&&e.key!==' '){e.preventDefault();const now=Date.now();typed.current={text:(now-typed.current.at<700?typed.current.text:'')+e.key.toLowerCase(),at:now};const index=options.filter(o=>!o.disabled).findIndex(o=>o.label.toLowerCase().startsWith(typed.current.text));menu.current?.querySelectorAll<HTMLButtonElement>('[role="option"]:not(:disabled)')[index]?.focus();}
  };
  return <><button type="button" ref={trigger} className={styles.trigger} disabled={disabled} aria-label={ariaLabel} aria-haspopup="listbox" aria-expanded={open&&!disabled} aria-controls={open?id:undefined} onKeyDown={keyDown} onClick={()=>{setPosition(null);setOpen(!open);}}><span>{options.find(o=>o.value===value)?.label??options[0]?.label??'Choose'}</span><svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="m4 6 4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5"/></svg></button>
    {open&&!disabled&&position&&createPortal(<div ref={menu} id={id} role="listbox" aria-label={ariaLabel} className={styles.menu} style={position} onKeyDown={keyDown} onBlur={e=>{if(!menu.current?.contains(e.relatedTarget)&&e.relatedTarget!==trigger.current)setOpen(false);}}>{options.map(option=><button key={option.value} type="button" role="option" disabled={option.disabled} aria-disabled={option.disabled||undefined} tabIndex={-1} aria-selected={option.value===value} onClick={()=>{onChange(option.value);close(true);}}><span>{option.label}</span>{option.value===value&&<span aria-hidden="true">✓</span>}</button>)}</div>,document.body)}
  </>;
}

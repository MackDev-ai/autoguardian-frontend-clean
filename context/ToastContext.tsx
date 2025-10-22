"use client";
import { createContext, useContext, useState } from "react";

type Toast = { id: number; type: "info"|"success"|"error"; text: string };
type ToastCtx = { push: (t: Omit<Toast,"id">) => void; };
const Ctx = createContext<ToastCtx | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);
  function push(t: Omit<Toast,"id">) {
    const id = Date.now(); setItems(p=>[...p,{...t,id}]);
    setTimeout(()=>setItems(p=>p.filter(x=>x.id!==id)), 3500);
  }
  return (
    <Ctx.Provider value={{ push }}>
      {children}
      <div style={{position:"fixed",right:16,bottom:16,display:"grid",gap:8,zIndex:9999}}>
        {items.map(i=>(
          <div key={i.id} className="card" style={{minWidth:280,borderColor:i.type==="success"?"#22b765":i.type==="error"?"#ff6b6b":"#2a3b64"}}>
            {i.text}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}
export function useToast(){ const c=useContext(Ctx); if(!c) throw new Error("useToast without provider"); return c; }

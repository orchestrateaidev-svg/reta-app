import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'

// Tiny toast system so logging actions confirm with "Logged" feedback and the
// controls say exactly what happened (copywriting guidance).

interface ToastMsg {
  id: number
  text: string
}
const ToastCtx = createContext<(text: string) => void>(() => {})

// eslint-disable-next-line react-refresh/only-export-components
export function useToast(): (text: string) => void {
  return useContext(ToastCtx)
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [msgs, setMsgs] = useState<ToastMsg[]>([])
  const push = useCallback((text: string) => {
    const id = performance.now()
    setMsgs((m) => [...m, { id, text }])
    window.setTimeout(() => {
      setMsgs((m) => m.filter((x) => x.id !== id))
    }, 2200)
  }, [])
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex flex-col items-center gap-2 px-4">
        {msgs.map((m) => (
          <div
            key={m.id}
            role="status"
            className="pointer-events-auto rounded-full bg-ink px-4 py-2 text-sm font-medium text-surface shadow-lg"
          >
            {m.text}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}

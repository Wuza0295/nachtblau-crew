import { createContext, useContext, useState, type ReactNode } from "react";
import type { MoodId } from "@shared/site";

type MoodContextValue = {
  mood: MoodId;
  setMood: (mood: MoodId) => void;
};

const MoodContext = createContext<MoodContextValue | null>(null);

export function MoodProvider({ children }: { children: ReactNode }) {
  const [mood, setMood] = useState<MoodId>("nah");
  return (
    <MoodContext.Provider value={{ mood, setMood }}>
      {children}
    </MoodContext.Provider>
  );
}

export function useMood() {
  const ctx = useContext(MoodContext);
  if (!ctx) throw new Error("useMood must be used within MoodProvider");
  return ctx;
}

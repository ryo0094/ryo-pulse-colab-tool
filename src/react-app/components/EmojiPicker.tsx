import { useEffect, useMemo, useRef, useState } from "react";

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

const EMOJIS = [
  "😀","😁","😂","🤣","😊","😍","😎","🤔","😢","🙏",
  "👍","👎","👏","🔥","🎉","🥳","💯","✅","❌","⭐",
  "❤️","💔","🫶","✨","🤖","🍀","🍕","☕","🧠","📎",
  "🙌","🤝","🙈","🙉","🙊","💪","🫡","🫠","🤯","🤩",
  "😆","🙂","😉","😌","😴","🤤","🤒","🤕","🤧","🤗",
  "💡","🧪","🛠️","⚙️","🧭","📈","📉","📊","📝","📚",
  "🖼️","🎬","🎧","🎮","🧩","🧵","🧶","🧱","🗂️","📦"
];

export default function EmojiPicker({ onSelect, onClose }: EmojiPickerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (!query.trim()) return EMOJIS;
    // Simple filter over emoji names by a small alias map; fallback to show all containing unicode name not available here.
    // For now, filter by common ascii keys the user might type.
    const aliases: Record<string, string[]> = {
      heart: ["❤️"], love: ["❤️","💔","🫶"], party: ["🎉","🥳"], fire: ["🔥"], star: ["⭐"],
      ok: ["✅"], check: ["✅"], x: ["❌"], thumbs: ["👍","👎"], clap: ["👏"], 100: ["💯"],
      idea: ["💡"], chart: ["📈","📉","📊"], tools: ["🛠️","⚙️"], note: ["📝"], book: ["📚"],
      image: ["🖼️"], music: ["🎧"], game: ["🎮"], puzzle: ["🧩"], package: ["📦"], file: ["📎"]
    };
    const hits = new Set<string>();
    for (const key of Object.keys(aliases)) {
      if (key.includes(query.toLowerCase())) {
        aliases[key].forEach(e => hits.add(e));
      }
    }
    return hits.size ? Array.from(hits) : EMOJIS;
  }, [query]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [onClose]);

  return (
    <div ref={ref} className="absolute bottom-16 left-3 w-64 p-2 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-20">
      <input
        autoFocus
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder=": search emojis"
        className="w-full mb-2 px-2 py-1 rounded bg-gray-700 text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
      <div className="grid grid-cols-8 gap-1 max-h-48 overflow-y-auto">
        {filtered.map(e => (
          <button
            key={e}
            type="button"
            className="text-xl p-1 hover:bg-gray-700 rounded"
            onClick={() => onSelect(e)}
          >
            {e}
          </button>
        ))}
      </div>
    </div>
  );
}



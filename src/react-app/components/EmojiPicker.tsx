import { useEffect, useRef } from "react";

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

const EMOJIS = [
  "😀","😁","😂","🤣","😊","😍","😎","🤔","😢","🙏",
  "👍","👎","👏","🔥","🎉","🥳","💯","✅","❌","⭐",
  "❤️","💔","🫶","✨","🤖","🍀","🍕","☕","🧠","📎"
];

export default function EmojiPicker({ onSelect, onClose }: EmojiPickerProps) {
  const ref = useRef<HTMLDivElement>(null);

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
      <div className="grid grid-cols-8 gap-1">
        {EMOJIS.map(e => (
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



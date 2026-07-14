import { useLocation } from "wouter";
import { ChevronRight } from "lucide-react";

export type ActionCategory = "document" | "miniapp" | "tool";

export interface SuggestedAction {
  category: ActionCategory;
  type: string;
  label: string;
  description: string;
}

const ACTION_TAG_REGEX = /\[SUGGEST_ACTION:(document|miniapp|tool)\|([^|\]]+)\|([^|\]]+)\|([^\]]+)\]/g;

export function parseActionSuggestions(content: string): {
  actions: SuggestedAction[];
  cleanContent: string;
} {
  const actions: SuggestedAction[] = [];
  const cleanContent = content
    .replace(new RegExp(ACTION_TAG_REGEX.source, "g"), (_full, category, type, label, description) => {
      actions.push({
        category: category as ActionCategory,
        type: type.trim(),
        label: label.trim(),
        description: description.trim(),
      });
      return "";
    })
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return { actions, cleanContent };
}

const CATEGORY_META: Record<ActionCategory, {
  colorBg: string;
  colorText: string;
  colorBorder: string;
  prefix: string;
}> = {
  document: {
    colorBg: "bg-blue-50 dark:bg-blue-950/30",
    colorText: "text-blue-700 dark:text-blue-300",
    colorBorder: "border-blue-200 dark:border-blue-800",
    prefix: "📄",
  },
  miniapp: {
    colorBg: "bg-violet-50 dark:bg-violet-950/30",
    colorText: "text-violet-700 dark:text-violet-300",
    colorBorder: "border-violet-200 dark:border-violet-800",
    prefix: "🔧",
  },
  tool: {
    colorBg: "bg-amber-50 dark:bg-amber-950/30",
    colorText: "text-amber-700 dark:text-amber-300",
    colorBorder: "border-amber-200 dark:border-amber-800",
    prefix: "⚡",
  },
};

const TOOL_ROUTES: Record<string, string> = {
  "rab-kalkulator": "/rab-kalkulator",
  "k3-vision": "/k3-vision",
  "ai-tools": "/ai-tools",
  "panduan-sbu": "/panduan-sbu",
  "panduan-askom": "/panduan-askom",
};

interface ActionChipsProps {
  actions: SuggestedAction[];
  conversationContext?: string;
  messageId?: string | number;
}

export function ActionChips({ actions, conversationContext, messageId }: ActionChipsProps) {
  const [, navigate] = useLocation();
  if (actions.length === 0) return null;

  function handleClick(action: SuggestedAction) {
    const ctx = conversationContext ? encodeURIComponent(conversationContext.slice(0, 800)) : "";
    if (action.category === "document") {
      navigate(`/doc-generator?type=${encodeURIComponent(action.type)}&label=${encodeURIComponent(action.label)}&ctx=${ctx}`);
    } else if (action.category === "tool") {
      const route = TOOL_ROUTES[action.type] || "/ai-tools";
      navigate(route);
    } else {
      navigate(`/doc-generator?miniapp=${encodeURIComponent(action.type)}&label=${encodeURIComponent(action.label)}&ctx=${ctx}`);
    }
  }

  return (
    <div
      className="mt-3 space-y-1.5"
      data-testid={messageId !== undefined ? `action-chips-${messageId}` : "action-chips"}
    >
      <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide px-0.5">
        Tindak Lanjut →
      </p>
      <div className="flex flex-wrap gap-2">
        {actions.map((action, i) => {
          const meta = CATEGORY_META[action.category];
          return (
            <button
              key={i}
              onClick={() => handleClick(action)}
              data-testid={`action-chip-${action.type}-${i}`}
              className={`
                inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-left
                transition-all duration-150 hover:shadow-md hover:scale-[1.02] active:scale-[0.98]
                ${meta.colorBg} ${meta.colorBorder} ${meta.colorText}
                text-xs font-medium cursor-pointer group max-w-xs
              `}
            >
              <span className="text-sm leading-none shrink-0">{meta.prefix}</span>
              <span className="flex-1 min-w-0">
                <span className="font-semibold block truncate">{action.label}</span>
                <span className="text-[10px] opacity-70 block truncate font-normal">{action.description}</span>
              </span>
              <ChevronRight className="w-3.5 h-3.5 shrink-0 opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

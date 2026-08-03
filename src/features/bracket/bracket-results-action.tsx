import { Share2, Trophy } from "lucide-react";

export function BracketResultsAction({ onView }: { onView: () => void }) {
  return (
    <button data-qa="view-tournament-results" onClick={onView} type="button">
      <Trophy aria-hidden="true" size={18} /> View results
    </button>
  );
}

export function BracketShareAction({ onShare }: { onShare: () => void }) {
  return (
    <button data-qa="share-bracket" onClick={onShare} type="button">
      <Share2 aria-hidden="true" size={18} /> Share bracket
    </button>
  );
}

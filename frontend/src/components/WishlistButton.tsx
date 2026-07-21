import { Heart } from "lucide-react";
import { useWishlist } from "../lib/wishlist-context";

export function WishlistButton({
  listingId,
  variant = "overlay",
}: {
  listingId: string;
  variant?: "overlay" | "inline";
}) {
  const { has, toggle } = useWishlist();
  const saved = has(listingId);

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    toggle(listingId);
  }

  if (variant === "inline") {
    return (
      <button
        onClick={handleClick}
        aria-pressed={saved}
        aria-label={saved ? "Remove from wishlist" : "Save to wishlist"}
        className={`btn-secondary ${saved ? "!text-red-600 !ring-red-200" : ""}`}
      >
        <Heart className={`h-4 w-4 ${saved ? "fill-red-600" : ""}`} />
        {saved ? "Saved" : "Save"}
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      aria-pressed={saved}
      aria-label={saved ? "Remove from wishlist" : "Save to wishlist"}
      className="flex h-8 w-8 items-center justify-center rounded-full bg-ink-950/50 text-white backdrop-blur transition hover:bg-ink-950/70"
    >
      <Heart className={`h-4 w-4 ${saved ? "fill-red-500 text-red-500" : ""}`} />
    </button>
  );
}

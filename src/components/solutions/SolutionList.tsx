import { SolutionCard } from "./SolutionCard";

interface Solution {
  id: string;
  body: string | null;
  file_url: string | null;
  submitted_by: string;
  author_name: string;
  upvotes: number;
  downvotes: number;
  user_vote: "up" | "down" | null;
  is_own: boolean;
  created_at: string;
}

interface SolutionListProps {
  solutions: Solution[];
}

export function SolutionList({ solutions }: SolutionListProps) {
  if (solutions.length === 0) {
    return null;
  }

  const sorted = [...solutions].sort(
    (a, b) => b.upvotes - b.downvotes - (a.upvotes - a.downvotes),
  );

  return (
    <div className="space-y-3">
      {sorted.map((sol) => (
        <SolutionCard
          key={sol.id}
          id={sol.id}
          body={sol.body}
          fileUrl={sol.file_url}
          authorName={sol.author_name}
          upvotes={sol.upvotes}
          downvotes={sol.downvotes}
          userVote={sol.user_vote}
          isOwn={sol.is_own}
          createdAt={sol.created_at}
        />
      ))}
    </div>
  );
}

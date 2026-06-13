import { VoteButtons } from "./VoteButtons";

interface SolutionCardProps {
  id: string;
  body: string | null;
  authorName: string;
  upvotes: number;
  downvotes: number;
  userVote: "up" | "down" | null;
  isOwn: boolean;
  createdAt: string;
}

export function SolutionCard({
  id,
  body,
  authorName,
  upvotes,
  downvotes,
  userVote,
  isOwn,
  createdAt,
}: SolutionCardProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-900">{authorName}</p>
          {body && <p className="mt-1 text-sm text-gray-700">{body}</p>}
        </div>
        <VoteButtons
          solutionId={id}
          upvotes={upvotes}
          downvotes={downvotes}
          userVote={userVote}
          isOwn={isOwn}
        />
      </div>
      <p className="mt-2 text-xs text-gray-400">
        {new Date(createdAt).toLocaleDateString()}
      </p>
    </div>
  );
}

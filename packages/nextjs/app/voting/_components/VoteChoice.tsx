import { useGlobalState } from "~~/services/store/store";

export const VoteChoice = () => {
  const voteChoice = useGlobalState(state => state.voteChoice);
  const setVoteChoice = useGlobalState(state => state.setVoteChoice);

  return (
    <div className="bg-base-100 shadow rounded-xl p-6 space-y-4">
      <div className="space-y-1 text-center">
        <h2 className="text-2xl font-bold">Choose your vote</h2>
      </div>
      <div className="flex gap-3 justify-center">
        <button
          className={`btn btn-lg ${voteChoice === true ? "btn-success" : "btn-outline"}`}
          onClick={() => setVoteChoice(true)}
        >
          Yes
        </button>
        <button
          className={`btn btn-lg ${voteChoice === false ? "btn-error" : "btn-outline"}`}
          onClick={() => setVoteChoice(false)}
        >
          No
        </button>
      </div>
    </div>
  );
};

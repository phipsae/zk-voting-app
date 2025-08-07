import { useGlobalState } from "~~/services/store/store";

export const VoteChoice = () => {
  const voteChoice = useGlobalState(state => state.voteChoice);
  const setVoteChoice = useGlobalState(state => state.setVoteChoice);

  return (
    <div className="flex flex-col items-center gap-4 bg-base-100 shadow-lg rounded-2xl p-6 mt-4">
      <h2 className="text-2xl font-bold">Your Vote</h2>
      <div className="flex gap-4">
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
      {voteChoice !== null && (
        <div className="text-lg">
          You selected:{" "}
          <span className={voteChoice ? "text-success font-bold" : "text-error font-bold"}>
            {voteChoice ? "Yes" : "No"}
          </span>
        </div>
      )}
    </div>
  );
};

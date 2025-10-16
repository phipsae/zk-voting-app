"use client";

import { useState } from "react";
import ListVotings from "./ListVotings";
import OwnedVotings from "./OwnedVotings";
import ParticipatedVotings from "./ParticipatedVotings";

const VotingOverview = () => {
  const [activeTab, setActiveTab] = useState<"all" | "owned" | "participated">("all");

  const tabs = [
    { id: "owned" as const, label: "My Votings", component: OwnedVotings },
    { id: "participated" as const, label: "I Can Vote", component: ParticipatedVotings },
    { id: "all" as const, label: "All Votings", component: ListVotings },
  ];

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || ListVotings;

  return (
    <div className="w-full space-y-6">
      <div className="tabs tabs-boxed w-fit">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab text-xl font-medium ${activeTab === tab.id ? "tab-active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
            style={{ fontSize: "2rem" }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="w-full">
        <ActiveComponent />
      </div>
    </div>
  );
};

export default VotingOverview;

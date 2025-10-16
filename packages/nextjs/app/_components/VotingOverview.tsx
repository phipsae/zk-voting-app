"use client";

import { useState } from "react";
import ListVotings from "./ListVotings";
import OwnedVotings from "./OwnedVotings";
import ParticipatedVotings from "./ParticipatedVotings";

const VotingOverview = () => {
  const [activeTab, setActiveTab] = useState<"all" | "owned" | "participated">("all");

  const tabs = [
    { id: "all" as const, label: "All Votings", component: ListVotings },
    { id: "owned" as const, label: "My Votings", component: OwnedVotings },
    { id: "participated" as const, label: "I Can Vote", component: ParticipatedVotings },
  ];

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || ListVotings;

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="tabs tabs-boxed w-fit">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab ${activeTab === tab.id ? "tab-active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Active Tab Content */}
      <div>
        <ActiveComponent />
      </div>
    </div>
  );
};

export default VotingOverview;

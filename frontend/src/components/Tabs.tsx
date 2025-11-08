import React, { useState } from "react";

export interface Tab {
  id: string;
  label: string;
  content: React.ReactNode;
  disabled?: boolean;
}

export interface TabsProps {
  tabs: Tab[];
  defaultTabId?: string;
  activeTabId?: string;
  onTabChange?: (tabId: string) => void;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  defaultTabId,
  activeTabId: controlledActiveTabId,
  onTabChange,
  className = "",
}) => {
  const [internalActiveTabId, setInternalActiveTabId] = useState(
    defaultTabId || tabs[0]?.id
  );
  const activeTabId =
    controlledActiveTabId !== undefined
      ? controlledActiveTabId
      : internalActiveTabId;

  const handleTabClick = (tabId: string) => {
    const tab = tabs.find((t) => t.id === tabId);
    if (tab && !tab.disabled) {
      if (controlledActiveTabId === undefined) {
        setInternalActiveTabId(tabId);
      }
      onTabChange?.(tabId);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, tabId: string) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleTabClick(tabId);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault();
      const currentIndex = tabs.findIndex((t) => t.id === tabId);
      const direction = e.key === "ArrowLeft" ? -1 : 1;
      let nextIndex = currentIndex + direction;

      // Wrap around
      if (nextIndex < 0) nextIndex = tabs.length - 1;
      if (nextIndex >= tabs.length) nextIndex = 0;

      const nextTab = tabs[nextIndex];
      if (nextTab && !nextTab.disabled) {
        handleTabClick(nextTab.id);
        // Focus the next tab
        const tabElement = document.querySelector(
          `[data-tab-id="${nextTab.id}"]`
        ) as HTMLElement;
        tabElement?.focus();
      }
    }
  };

  const activeTab = tabs.find((t) => t.id === activeTabId);

  return (
    <div className={className}>
      <div className="border-b border-border" role="tablist">
        <div className="flex space-x-1">
          {tabs.map((tab) => {
            const isActive = tab.id === activeTabId;
            return (
              <button
                key={tab.id}
                data-tab-id={tab.id}
                role="tab"
                aria-selected={isActive}
                aria-controls={`tab-panel-${tab.id}`}
                id={`tab-${tab.id}`}
                disabled={tab.disabled}
                onClick={() => handleTabClick(tab.id)}
                onKeyDown={(e) => handleKeyDown(e, tab.id)}
                className={`
                  px-4 py-2 font-medium text-sm transition-all duration-200
                  focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background
                  min-h-[44px]
                  ${
                    isActive
                      ? "text-primary border-b-2 border-primary"
                      : "text-text-secondary hover:text-text-primary hover:border-b-2 hover:border-border"
                  }
                  ${
                    tab.disabled
                      ? "opacity-50 cursor-not-allowed"
                      : "cursor-pointer"
                  }
                `}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>
      <div
        role="tabpanel"
        id={`tab-panel-${activeTabId}`}
        aria-labelledby={`tab-${activeTabId}`}
        className="mt-4"
      >
        {activeTab?.content}
      </div>
    </div>
  );
};

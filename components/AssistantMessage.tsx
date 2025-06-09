"use client";

import { AssistantMessageProps } from "@copilotkit/react-ui";
import { Markdown } from "@copilotkit/react-ui";
import { Loader } from "lucide-react";

export const CustomAssistantMessage = (props: AssistantMessageProps) => {
  const { message, isLoading, subComponent } = props;

  return (
    <div className="pb-4">
      {(message || isLoading) && (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="text-sm text-gray-700 dark:text-gray-300">
            <Markdown
              content={message || ""}
              components={{
                // This tells the Markdown component to not wrap its output in <p> tags,
                // which prevents the invalid nesting of <div> inside <p>.
                p: ({ children }) => <>{children}</>,
              }}
            />

            {isLoading && (
              <div className="flex items-center gap-2 text-xs text-blue-500">
                <Loader className="h-3 w-3 animate-spin" />
                <span>Thinking...</span>
              </div>
            )}
          </div>
        </div>
      )}

      {subComponent && <div>{subComponent}</div>}
    </div>
  );
};

import { useCallback } from "react";
import { clsx } from "clsx";

interface TagSelectorProps {
  tags: any;
  onTagChange: (newTag: string) => void;
  currTag: string;
}

const TagSelector = (props: TagSelectorProps) => {
  const { tags = ["all"], onTagChange, currTag } = props;

  const renderTags = useCallback(() => {
    return tags.map((each: string) => {
      const isActive = currTag === each;
      return (
        <button
          key={`${each}-select-tag`}
          onClick={() => onTagChange(each)}
          className={clsx(
            "rounded-md px-3 py-1 text-sm transition-all md:px-4 md:py-1.5",
            isActive
              ? "bg-gray-600 text-white hover:bg-gray-700 dark:bg-gray-200 dark:text-gray-900 dark:hover:bg-gray-300"
              : "bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
          )}
        >
          {each}
        </button>
      );
    });
  }, [tags, onTagChange, currTag]);

  return (
    <div className="w-full mb-4 md:mb-6">
      <div className="flex flex-wrap gap-2 md:gap-3">
        {renderTags()}
      </div>
    </div>
  );
};

export default TagSelector;

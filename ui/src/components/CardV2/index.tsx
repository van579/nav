import { useMemo } from "react";
import clsx from "clsx";
import { getJumpTarget } from "../../utils/setting";
import { ToolLogo } from "../ToolLogo";

interface CardProps {
  title: string;
  url: string;
  des: string;
  logo: string;
  catelog: string;
  onClick: () => void;
  index: number;
  isSearching: boolean;
}

const Card = ({ title, url, des, logo, catelog, onClick, index, isSearching }: CardProps) => {

  const showNumIndex = index < 10 && isSearching;

  return (
    <a
      href={url === "toggleJumpTarget" ? undefined : url}
      onClick={onClick}
      target={getJumpTarget() === "blank" ? "_blank" : "_self"}
      rel="noreferrer"
      className={clsx("van-card", styles.container)}
    >
      {showNumIndex && (
        <span className={clsx("van-card-index", styles.index)}>
          {index + 1}
        </span>
      )}

      <div className={clsx("van-card-icon", styles.iconWrapper)}>
        <ToolLogo logo={logo} name={title} url={url} className="h-full w-full text-xl" />
      </div>

      <div className={clsx("van-card-content", styles.content)}>
        <div className={clsx("van-card-header", styles.header)}>
          <h3 className={clsx("van-card-title", styles.title)} title={title}>
            {title}
          </h3>
          {catelog && (
            <span className={clsx("van-card-catelog", styles.catelog)}>
              {catelog}
            </span>
          )}
        </div>
        <p className={clsx("van-card-desc", styles.desc)} title={des}>
          {des}
        </p>
      </div>
    </a>
  );
};

const styles = {
  container: "group relative flex w-full cursor-pointer flex-col items-center p-4 rounded-xl bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg dark:bg-gray-800 sm:flex-row sm:items-center sm:text-left",
  index: "absolute right-2 top-2 font-mono text-xs text-gray-300 dark:text-gray-600",
  iconWrapper: "mb-2 flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-lg bg-gray-50 dark:bg-gray-700 overflow-hidden sm:mb-0 sm:mr-4 sm:h-12 sm:w-12",
  // iconPlaceholder: removed
  // iconImg: removed
  content: "flex flex-col items-center min-w-0 flex-1 w-full sm:items-start",
  header: "flex flex-col items-center gap-1 w-full sm:flex-row sm:justify-between sm:w-full",
  title: "truncate text-sm text-gray-900 dark:text-gray-100 w-full text-center sm:w-auto sm:text-left sm:flex-1",
  catelog: "hidden sm:block shrink-0 rounded bg-gray-100 px-2 py-0.5 text-[10px] text-gray-500 dark:bg-gray-700 dark:text-gray-400",
  desc: "hidden sm:line-clamp-3 mt-1 text-xs text-gray-500 dark:text-gray-400 break-all",
};

export default Card;


import { useEffect, useRef } from "react";

interface SearchBarProps {
  setSearchText: (t: string) => void;
  searchString: string;
}

const SearchBar = (props: SearchBarProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const onKeyDown = (ev: KeyboardEvent) => {
    // Only focus if not already focused on an input/textarea
    const activeElement = document.activeElement;
    if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
      return;
    }

    const reg = /[a-zA-Z0-9]|[\u4e00-\u9fa5]/g;
    if (ev.code === "Enter" || reg.test(ev.key)) {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  }

  useEffect(() => {
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown)
    }
  }, [])

  return (
    <div className="mb-4 w-full md:mb-6">
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
          </svg>
        </div>
        <input
          ref={inputRef}
          id="search-bar"
          type="search"
          className="block w-full rounded-md border-0 bg-gray-100 py-3 pl-10 pr-4 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-inset focus:ring-blue-600 dark:bg-gray-800 dark:text-white dark:ring-gray-700 dark:placeholder:text-gray-500 dark:focus:bg-gray-800 sm:text-lg sm:leading-6 transition-all"
          placeholder="按任意键直接开始搜索..."
          value={props.searchString}
          onChange={(ev) => {
            const v = ev.target.value
            props.setSearchText(v);
          }}
        />
      </div>
    </div>
  );
};

export default SearchBar;

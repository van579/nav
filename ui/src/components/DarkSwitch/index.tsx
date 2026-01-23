
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { applyTheme, decodeTheme, initTheme } from "../../utils/theme";
import { clsx } from "clsx";

const DarkSwitch = ({ showGithub }: { showGithub: boolean }) => {
  const [theme, setTheme] = useState(initTheme());
  const { current } = useRef<any>({ hasInit: false });
  const { current: currentTimer } = useRef<any>({ timer: null });

  useEffect(() => {
    if (currentTimer.timer) {
      clearInterval(currentTimer.timer);
      currentTimer.timer = null;
    }
    localStorage.setItem("theme", theme)
    const realTheme = decodeTheme(theme as any);
    applyTheme(realTheme, 'setTheme', true);
    if (realTheme.includes("auto")) {
      currentTimer.timer = setInterval(() => {
        const realTheme = decodeTheme("auto");
        applyTheme(realTheme, "autoThemeTimer", true);
      }, 10000);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme])


  useLayoutEffect(() => {
    if (!current.hasInit) {
      current.hasInit = true;
      if (!localStorage.getItem("theme")) {
        setTheme("auto");
      } else {
        const iTheme = initTheme();
        setTheme(iTheme);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSwitch = () => {
    if (theme === "light") {
      setTheme("dark");
    } else if (theme === "dark") {
      setTheme("auto");
    } else {
      setTheme("light");
    }
  };

  return (
    <div
      className={clsx(
        "fixed right-3 z-50 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-white/80 shadow-sm backdrop-blur transition-all hover:bg-white hover:shadow-md dark:bg-gray-800/80 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200",
        showGithub ? "bottom-12 md:bottom-16" : "bottom-3 md:bottom-5"
      )}
      onClick={handleSwitch}
      title={`当前主题: ${theme}`}
    >
      {theme === "light" && (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
          <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z" />
        </svg>
      )}
      {theme === "dark" && (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
          <path fillRule="evenodd" d="M9.528 1.718a.75.75 0 01.162.819A8.97 8.97 0 009 6a9 9 0 009 9 8.97 8.97 0 003.463-.69.75.75 0 01.981.98 10.503 10.503 0 01-9.694 6.46c-5.799 0-10.5-4.7-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 01.818.162z" clipRule="evenodd" />
        </svg>
      )}
      {theme === "auto" && (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
          <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 000-1.5h-3.75V6z" clipRule="evenodd" />
        </svg>
      )}
    </div>
  );
};
export default DarkSwitch;

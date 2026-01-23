
import CardV2 from "../CardV2";
import SearchBar from "../SearchBar";
import { Loading } from "../Loading";
import { Helmet } from "react-helmet";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { FetchList } from "../../utils/api";
import TagSelector from "../TagSelector";
import pinyin from "pinyin-match";
import GithubLink from "../GithubLink";
import DarkSwitch from "../DarkSwitch";

import { toggleJumpTarget } from "../../utils/setting";
import LockScreen from "../LockScreen";
import { InboxIcon } from "@heroicons/react/24/outline";

const mutiSearch = (s: string, t: string) => {
  const source = (s || "").toLowerCase();
  const target = t.toLowerCase();
  const rawInclude = source.includes(target);
  const pinYinInlcude = Boolean(pinyin.match(source, target));
  return rawInclude || pinYinInlcude;
};

const Content = (props: any) => {
  const [data, setData] = useState<any>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [currTag, setCurrTag] = useState("全部工具");
  const [searchString, setSearchString] = useState("");
  const [val, setVal] = useState("");
  const [locked, setLocked] = useState(false);

  const filteredDataRef = useRef<any>([]);

  const showGithub = useMemo(() => {
    const hide = data?.setting?.hideGithub === true
    return !hide;
  }, [data])

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const r = await FetchList();
      if (r.locked) {
        setLocked(true);
        // Still set data setting for title/favicon if available?
        // Backend returns setting even if locked.
        setData({ setting: r.setting });
      } else {
        setLocked(false);
        setData(r);
        const tagInLocalStorage = window.localStorage.getItem("tag");
        if (tagInLocalStorage && tagInLocalStorage !== "") {
          if (r?.catelogs && r?.catelogs.includes(tagInLocalStorage)) {
            setCurrTag(tagInLocalStorage);
          }
        }
      }
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  }, [setData, setLoading, setCurrTag]);

  useEffect(() => {
    loadData();
  }, [loadData]);


  // Inject Custom Code
  useEffect(() => {
    if (data?.setting) {
      // CSS
      if (data.setting.customCSS) {
        const style = document.createElement('style');
        style.id = 'custom-css';
        style.innerHTML = data.setting.customCSS;
        document.head.appendChild(style);
        return () => {
          const el = document.getElementById('custom-css');
          if (el) el.remove();
        };
      }
    }
  }, [data?.setting?.customCSS]);

  useEffect(() => {
    if (data?.setting?.customJS) {
      try {
        const rawJS = data.setting.customJS.trim();
        const existingScript = document.getElementById('custom-js');
        if (existingScript) existingScript.remove();

        // Check if input is a script tag
        if (rawJS.startsWith('<script')) {
          const div = document.createElement('div');
          div.innerHTML = rawJS;
          const originalScript = div.querySelector('script');

          if (originalScript) {
            const script = document.createElement('script');
            script.id = 'custom-js';

            // Copy all attributes
            Array.from(originalScript.attributes).forEach(attr => {
              script.setAttribute(attr.name, attr.value);
            });

            // Copy content
            if (originalScript.innerHTML) {
              script.innerHTML = originalScript.innerHTML;
            }

            document.body.appendChild(script);
          }
        } else {
          // Treat as raw JS code
          const script = document.createElement('script');
          script.id = 'custom-js';
          script.innerHTML = rawJS;
          document.body.appendChild(script);
        }

        return () => {
          const el = document.getElementById('custom-js');
          if (el) el.remove();
        };
      } catch (e) {
        console.error("Failed to inject custom JS", e);
      }
    }
  }, [data?.setting?.customJS]);

  const handleSetCurrTag = (tag: string) => {
    setCurrTag(tag);
    if (tag !== "管理后台") {
      window.localStorage.setItem("tag", tag);
    }
    resetSearch(true);
  };

  const resetSearch = (notSetTag?: boolean) => {
    setVal("");
    setSearchString("");
    const tagInLocalStorage = window.localStorage.getItem("tag");
    if (!notSetTag && tagInLocalStorage && tagInLocalStorage !== "" && tagInLocalStorage !== "管理后台") {
      setCurrTag(tagInLocalStorage);
    }
  };

  const handleSetSearch = (val: string) => {
    if (val !== "" && val) {
      setCurrTag("全部工具");
      setSearchString(val.trim());
    } else {
      resetSearch();
    }
  }

  const filteredData = useMemo(() => {
    if (data.tools) {
      const localResult = data.tools
        .filter((item: any) => {
          if (currTag === "全部工具") return true;
          return item.catelog === currTag;
        })
        .filter((item: any) => {
          if (searchString === "") return true;
          return (
            mutiSearch(item.name, searchString) ||
            mutiSearch(item.desc, searchString) ||
            mutiSearch(item.url, searchString)
          );
        });
      return localResult;
    } else {
      return [];
    }
  }, [data, currTag, searchString]);

  useEffect(() => {
    filteredDataRef.current = filteredData
  }, [filteredData])

  const onKeyEnter = useCallback((ev: KeyboardEvent) => {
    const cards = filteredDataRef.current;
    if (ev.keyCode === 13) {
      if (cards && cards.length) {
        window.open(cards[0]?.url, "_blank");
        resetSearch();
      }
    }
    if (ev.ctrlKey || ev.metaKey) {
      const num = Number(ev.key);
      if (isNaN(num)) return;
      ev.preventDefault()
      const index = Number(ev.key) - 1;
      if (index >= 0 && index < cards.length) {
        window.open(cards[index]?.url, "_blank");
        resetSearch();
      }
    }
  }, []);

  useEffect(() => {
    if (searchString.trim() === "") {
      document.removeEventListener("keydown", onKeyEnter);
    } else {
      document.addEventListener("keydown", onKeyEnter);
    }
    return () => {
      document.removeEventListener("keydown", onKeyEnter);
    }
  }, [searchString, onKeyEnter])

  const renderCardsV2 = () => {
    return filteredData.map((item, index) => {
      return (
        <CardV2
          title={item.name}
          url={item.url}
          des={item.desc}
          logo={item.logo}
          key={item.id}
          catelog={item.catelog}
          index={index}
          isSearching={searchString.trim() !== ""}
          onClick={() => {
            resetSearch();
            if (item.url === "toggleJumpTarget") {
              toggleJumpTarget();
              loadData();
            }
          }}
        />
      );
    });
  };

  if (locked) {
    return <LockScreen onUnlock={loadData} />;
  }

  return (
    <div className={clsx("van-layout-root", styles.root)}>
      <Helmet>
        <meta charSet="utf-8" />
        <link
          rel="icon"
          href={data?.setting?.favicon ?? "favicon.ico"}
        />
        <title>{data?.setting?.title ?? "Van Nav"}</title>
      </Helmet>

      {/* Top Bar - Sticky */}
      <div className={clsx("van-layout-header", styles.header)}>
        <div className={clsx("van-layout-header-content", styles.headerContent)}>
          <SearchBar
            searchString={val}
            setSearchText={(t) => {
              setVal(t);
              handleSetSearch(t);
            }}
          />
          <TagSelector
            tags={data?.catelogs ?? ["全部工具"]}
            currTag={currTag}
            onTagChange={handleSetCurrTag}
          />
        </div>
      </div>

      {/* Content Area */}
      <div className={clsx("van-layout-content", styles.contentContainer)}>
        {loading ? (
          <Loading />
        ) : filteredData.length > 0 ? (
          <div className={clsx("van-layout-grid", styles.grid)} style={{ gridTemplateColumns: "repeat(auto-fill, minmax(var(--card-min-width), 1fr))" }}>
            {renderCardsV2()}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in zoom-in-95 duration-300">
            <InboxIcon className="h-16 w-16 text-gray-300 dark:text-gray-700 mb-4" />
            <p className="text-gray-400 dark:text-gray-500 text-sm">
              {searchString ? (
                <span>
                  没有找到与 <span className="font-medium text-gray-500 dark:text-gray-400">“{searchString}”</span> 相关的工具
                </span>
              ) : (
                "这里空空如也"
              )}
            </p>
          </div>
        )}
      </div>

      {/* Footer / Record */}
      <div className={clsx("van-layout-footer", styles.footer)}>
        <a href="https://beian.miit.gov.cn" target="_blank" rel="noreferrer" className="hover:text-gray-500 transition-colors">
          {data?.setting?.govRecord ?? ""}
        </a>
      </div>

      {showGithub && <GithubLink />}
      <DarkSwitch showGithub={showGithub} />
    </div>
  );
};

const styles = {
  root: "min-h-screen bg-gray-50 pb-20 dark:bg-gray-900",
  header: "sticky top-0 z-30 w-full bg-gray-50/90 py-4 backdrop-blur transition-colors dark:bg-gray-900/90",
  headerContent: "container mx-auto px-4 max-w-7xl",
  contentContainer: "container mx-auto px-4 max-w-7xl",
  grid: "grid gap-3 sm:gap-4",
  footer: "fixed bottom-2 left-0 right-0 text-center text-xs text-gray-400 dark:text-gray-600",
};

export default Content;

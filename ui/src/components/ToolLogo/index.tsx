import { useMemo, useState, useEffect, useRef } from "react";
import clsx from "clsx";

interface ToolLogoProps {
    logo?: string;
    name: string;
    className?: string;
    url?: string;
    timeout?: number; // Timeout in ms
}

export const getLogoSrc = (logo: string) => {
    if (!logo) return "";
    if (logo.startsWith("data:") || logo.startsWith("http") || logo.startsWith("//")) return logo;
    return `/api/img?url=${encodeURIComponent(logo)}`;
};

export const ToolLogo = ({ logo, name, className, url, timeout = 2000 }: ToolLogoProps) => {
    const [imgError, setImgError] = useState(false);
    const loadedRef = useRef(false);

    const bgColor = useMemo(() => {
        const colors = [
            'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
            'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
            'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
            'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
            'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
            'bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400',
            'bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400',
            'bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400',
            'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
            'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',
            'bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400',
            'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
            'bg-fuchsia-100 text-fuchsia-600 dark:bg-fuchsia-900/30 dark:text-fuchsia-400',
            'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400',
            'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400',
        ];
        let hash = 0;
        const stableName = name || "Tool";
        for (let i = 0; i < stableName.length; i++) {
            hash = stableName.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    }, [name]);

    const src = (url === "admin" && logo) ? logo : getLogoSrc(logo || "");

    useEffect(() => {
        setImgError(false);
        loadedRef.current = false;

        if (!src) return;

        const timer = setTimeout(() => {
            if (!loadedRef.current) {
                setImgError(true);
            }
        }, timeout);

        return () => clearTimeout(timer);
    }, [src, timeout]);

    if (!logo || imgError) {
        return (
            <div className={clsx("flex items-center justify-center font-bold uppercase flex-shrink-0 rounded-lg", bgColor, className)}>
                {name ? name.charAt(0) : "T"}
            </div>
        );
    }

    return (
        <img
            src={src}
            alt={name}
            className={clsx("object-cover flex-shrink-0 rounded-lg bg-gray-100", className)}
            onLoad={() => { loadedRef.current = true; }}
            onError={() => setImgError(true)}
        />
    );
};


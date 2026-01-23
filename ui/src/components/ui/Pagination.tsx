import React from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { Button } from "./Button";

interface PaginationProps {
    currentPage: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
}

export const Pagination = ({ currentPage, pageSize, total, onPageChange }: PaginationProps) => {
    const totalPages = Math.ceil(total / pageSize);

    if (totalPages <= 1) return null;

    const renderPageButton = (page: number) => (
        <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${currentPage === page
                    ? 'z-10 bg-blue-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
                    : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:text-gray-100 dark:ring-gray-600 dark:hover:bg-gray-700'
                } focus:z-20 focus:outline-offset-0`}
        >
            {page}
        </button>
    );

    const renderEllipsis = (key: string) => (
        <span key={key} className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300 dark:text-gray-400 dark:ring-gray-600 focus:outline-offset-0">
            ...
        </span>
    );

    const renderPages = () => {
        const pages = [];
        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(renderPageButton(i));
            }
        } else {
            // Always show first
            pages.push(renderPageButton(1));

            if (currentPage > 3) {
                pages.push(renderEllipsis("start-ellipsis"));
            }

            const start = Math.max(2, currentPage - 1);
            const end = Math.min(totalPages - 1, currentPage + 1);

            for (let i = start; i <= end; i++) {
                pages.push(renderPageButton(i));
            }

            if (currentPage < totalPages - 2) {
                pages.push(renderEllipsis("end-ellipsis"));
            }

            // Always show last
            pages.push(renderPageButton(totalPages));
        }
        return pages;
    };

    return (
        <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 dark:border-gray-700 dark:bg-gray-800">
            <div className="flex flex-1 justify-between sm:hidden">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                >
                    上一页
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                >
                    下一页
                </Button>
            </div>
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                <div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                        显示第 <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span> 到 <span className="font-medium">{Math.min(currentPage * pageSize, total)}</span>条，
                        共 <span className="font-medium">{total}</span> 条
                    </p>
                </div>
                <div>
                    <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                        <button
                            onClick={() => onPageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed dark:ring-gray-600 dark:hover:bg-gray-700"
                        >
                            <span className="sr-only">Previous</span>
                            <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
                        </button>
                        {renderPages()}
                        <button
                            onClick={() => onPageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed dark:ring-gray-600 dark:hover:bg-gray-700"
                        >
                            <span className="sr-only">Next</span>
                            <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
                        </button>
                    </nav>
                </div>
            </div>
        </div>
    );
};

type ChapterLeaderFilterOption = {
  key: string;
  href: string;
};

type ChapterLeaderFilterRouter = {
  replace: (href: string, options: { scroll: boolean }) => void;
};

export function navigateToSelectedChapterLeaderFilter<T extends ChapterLeaderFilterOption>(
  options: T[],
  selectedKey: string,
  navigate: (href: string) => void,
) {
  const nextOption = options.find((option) => option.key === selectedKey);

  if (!nextOption) {
    return null;
  }

  navigate(nextOption.href);

  return nextOption.href;
}

export function createChapterLeaderFilterNavigate(
  router: ChapterLeaderFilterRouter,
) {
  return (href: string) => router.replace(href, { scroll: false });
}

type ChapterLeaderFilterOption = {
  key: string;
  href: string;
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

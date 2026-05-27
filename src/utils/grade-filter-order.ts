type GradeOption = {
  title: string;
};

const normalizeGradeTitle = (title: string) =>
  title
    .toLowerCase()
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const GRADE_FILTER_ORDER_MATCHERS: Array<(title: string) => boolean> = [
  (title) => title.includes("primary") || /grades? 1 4/.test(title),
  (title) => title.includes("scholarship") || /grade 5/.test(title),
  (title) => title.includes("junior secondary") || /grades? 6 9/.test(title),
  (title) =>
    title.includes("ordinary level") &&
    !title.includes("cambridge") &&
    !title.includes("edexcel"),
  (title) =>
    title.includes("advanced level") && title.includes("physical science"),
  (title) =>
    title.includes("advanced level") && title.includes("biological science"),
  (title) => title.includes("advanced level") && title.includes("commerce"),
  (title) => title.includes("advanced level") && /\barts?\b/.test(title),
  (title) => title.includes("advanced level") && title.includes("technology"),
  (title) => title.includes("sports") && title.includes("fitness"),
  (title) => title.includes("communication") && title.includes("speaking"),
  (title) => title.includes("computing"),
  (title) => title.includes("multimedia") && title.includes("design"),
  (title) => title.includes("languages"),
  (title) => title.includes("diploma"),
  (title) => title.includes("cambridge") && title.includes("ordinary level"),
  (title) => title.includes("cambridge") && title.includes("advanced level"),
  (title) => title.includes("edexcel") && title.includes("ordinary level"),
  (title) => title.includes("edexcel") && title.includes("advanced level"),
];

const getGradeFilterRank = (title: string) => {
  const normalizedTitle = normalizeGradeTitle(title);
  const matchedIndex = GRADE_FILTER_ORDER_MATCHERS.findIndex((matcher) =>
    matcher(normalizedTitle),
  );

  return matchedIndex === -1
    ? GRADE_FILTER_ORDER_MATCHERS.length
    : matchedIndex;
};

export const sortBySchoolGradeOrder = <T extends GradeOption>(grades: T[]) =>
  [...grades].sort((gradeA, gradeB) => {
    const rankDifference =
      getGradeFilterRank(gradeA.title) - getGradeFilterRank(gradeB.title);

    return rankDifference || gradeA.title.localeCompare(gradeB.title, "en");
  });

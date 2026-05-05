export type PaginationMeta = {
  current_page: number;
  last_page: number;
  per_page: number;
  from: number;
  to: number;
  total: number;
};

export type Paginated<T> = {
  data: T[];
  meta: PaginationMeta;
};

export function buildPaginated<T>(
  data: T[],
  total: number,
  page: number,
  pageSize: number,
): Paginated<T> {
  const lastPage = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = total === 0 ? 0 : Math.min((page - 1) * pageSize + data.length, total);

  return {
    data,
    meta: {
      current_page: page,
      last_page: lastPage,
      per_page: pageSize,
      from,
      to,
      total,
    },
  };
}

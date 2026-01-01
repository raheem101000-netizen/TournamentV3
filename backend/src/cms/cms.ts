import { Chain, FromSelector, HOST, Selector } from '@/src/cms/zeus/index.js';
import { Category } from '@/src/main/models.js';
import { LRUCache } from 'lru-cache';

const cmsCache = new LRUCache({
  max: 1000,
  ttl: 1000 * 15,
});

export const getCategoriesFromCms = async () => {
  const client = Chain(HOST)('query');
  const fromCache = cmsCache.get('categories');
  if (fromCache) return fromCache as CategoryType[];
  const result = await client({
    listPaginatedcategory: [
      { page: { limit: 100 } },
      {
        items: {
          avatar: { url: true },
          img: { url: true, thumbnail: true },
          name: true,
          slug: true,
        },
      },
    ],
  });
  const items = result.listPaginatedcategory?.items;
  cmsCache.set('categories', items);
  return (items || []) as CategoryType[];
};

export const getCategories = async () => {
  const result = await getCategoriesFromCms();
  return result.map((r) => ({
    ...r,
    image: r.img?.url as string,
    image_thumbnail: r.img?.thumbnail as string,
  })) satisfies Category[];
};

const CategorySelector = Selector('category')({
  avatar: { url: true },
  img: { url: true, thumbnail: true },
  name: true,
  slug: true,
});

export type CategoryType = Omit<FromSelector<typeof CategorySelector, 'category'>, 'slug'> & { slug: string };

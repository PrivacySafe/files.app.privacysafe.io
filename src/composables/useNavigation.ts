/*
 Copyright (C) 2025 3NSoft Inc.

 This program is free software: you can redistribute it and/or modify it under
 the terms of the GNU General Public License as published by the Free Software
 Foundation, either version 3 of the License, or (at your option) any later
 version.

 This program is distributed in the hope that it will be useful, but
 WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 See the GNU General Public License for more details.

 You should have received a copy of the GNU General Public License along with
 this program. If not, see <http://www.gnu.org/licenses/>.
*/
import { computed, type ComputedRef } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type { RouteSingle, RouteDouble } from '@/types';
import { APP_ROUTES } from '@/constants';

export function useNavigation() {
  const route = useRoute();
  const router = useRouter();

  const isSplittedMode = computed(() => route.name === APP_ROUTES.DOUBLE);
  const isTileView = computed(() => route.query.view === 'tile');

  const activeWindow = computed(() => {
    if (isSplittedMode.value) {
      const { activeWindow = '1' } = route.query as RouteDouble['query'];
      return activeWindow;
    }

    return '1';
  }) as ComputedRef<'1' | '2'>;

  const window1FsId = computed(() => route.params.fsId as string);
  const window1RootFolderId = computed(() => route.params.folderId as string);
  const window2FsId = computed(() => {
    if (isSplittedMode.value) {
      return route.params.fs2Id as string;
    }

    return null;
  });
  const window2RootFolderId = computed(() => {
    if (isSplittedMode.value) {
      return route.params.folder2Id as string;
    }

    return null;
  });

  async function navigateToRouteSingle({
    params,
    query,
  }: {
    params?: Partial<RouteSingle['params']>;
    query?: Partial<RouteSingle['query']>;
  }) {
    const newRouterData: RouteSingle = {
      name: APP_ROUTES.SINGLE,
      params: {
        ...(route.params as RouteSingle['params']),
        ...(params?.fsId && { fsId: params.fsId }),
        ...(params?.folderId && { folderId: params.folderId }),
      },
      query: {
        ...(route.query as RouteSingle['query']),
        view: query?.view ?? 'table',
        activeWindow: '1',
        ...((query?.path || query?.path === '') && { path: query.path }),
        ...(query?.sortBy && { sortBy: query.sortBy }),
        ...(query?.sortOrder && { sortOrder: query.sortOrder }),
      },
    };

    return router.push(newRouterData);
  }

  async function navigateToRouteDouble({
    params,
    query,
  }: {
    params?: Partial<RouteDouble['params']>;
    query?: Partial<RouteDouble['query']>;
  }) {
    const newRouterData: RouteDouble = {
      name: APP_ROUTES.DOUBLE,
      params: {
        ...(route.params as RouteDouble['params']),
        ...(params?.fsId && { fsId: params.fsId }),
        ...(params?.folderId && { folderId: params.folderId }),
        ...(params?.fs2Id && { fs2Id: params.fs2Id }),
        ...(params?.folder2Id && { folder2Id: params.folder2Id }),
      },
      query: {
        ...(route.query as RouteDouble['query']),
        view: query?.view ?? 'table',
        ...(query?.activeWindow && { activeWindow: query.activeWindow }),
        ...((query?.path || query?.path === '') && { path: query.path }),
        ...(query?.sortBy && { sortBy: query.sortBy }),
        ...(query?.sortOrder && { sortOrder: query.sortOrder }),
        ...((query?.path2 || query?.path2 === '') && { path2: query.path2 }),
        ...(query?.sort2By && { sort2By: query.sort2By }),
        ...(query?.sort2Order && { sort2Order: query.sort2Order }),
      },
    };

    return router.push(newRouterData);
  }

  return {
    route,
    router,
    isSplittedMode,
    isTileView,
    activeWindow,
    window1FsId,
    window1RootFolderId,
    window2FsId,
    window2RootFolderId,
    navigateToRouteSingle,
    navigateToRouteDouble,
  };
}

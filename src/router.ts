/*
 Copyright (C) 2024-2025 3NSoft Inc.

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
import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';
import Dashboard from '@/views/dashboard.vue';
import HomeFolder from '@/views/home/home.vue';
import RecentFolder from '@/views/recent.vue';
import TrashFolder from '@/views/trash/trash.vue';

const routes: RouteRecordRaw[] = [
  { path: '/', redirect: '/dashboard/home' },
  { path: '/index.html', redirect: '/dashboard/home' },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: Dashboard,
    children: [
      { path: 'home', name: 'folder-home', component: HomeFolder },
      { path: 'recent', name: 'folder-recent', component: RecentFolder },
      { path: 'trash', name: 'folder-trash', component: TrashFolder },
    ],
  },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});

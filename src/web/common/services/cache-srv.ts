/*
 Copyright (C) 2016 3NSoft Inc.

 This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

 This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

 You should have received a copy of the GNU General Public License along with this program. If not, see <http://www.gnu.org/licenses/>. */

export let ModuleName = "3nClient.services.cache";
export let CacheSrvName = "cacheService";


export function addService(angular: angular.IAngularStatic): void {
  let mod = angular.module(ModuleName, []);
  mod.service(CacheSrvName, Cache);
}

export class Cache {
  public username: string;
  public general: {
    appSelected: number;
    progressBar: boolean;
    blockUI: boolean;
    observeSendings: string[];
  };
  public notifications: {
    list: client3N.Notification[]
  };


  static $inject = ["$rootScope"];
  constructor(
    private $rootScope: angular.IRootScopeService
  ) {
    this.username = "";
    this.general = {
      progressBar: false,
      blockUI: false,
      appSelected: 1,
      observeSendings: []
    };
    this.notifications = {
      list: []
    };

  }

}
